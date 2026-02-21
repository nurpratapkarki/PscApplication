import csv
import io
import json
import re
from pathlib import Path

from django.db import transaction
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from src.api.permissions import IsOwnerOrReadOnly
from src.api.question_answer.serializers import (
    QuestionReportSerializer,
    QuestionSerializer,
)
from src.models.analytics import Contribution
from src.models.question_answer import Answer, Question, QuestionReport


class QuestionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Questions.
    Users can read public questions.
    Users can create questions (contribution).
    Users can update/delete their own questions if not public (checked in permission or perform_update).
    """

    queryset = Question.objects.filter(status="PUBLIC").order_by("-created_at")
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["category", "difficulty_level", "question_type"]
    search_fields = ["question_text_en", "question_text_np"]
    ordering_fields = ["created_at", "times_attempted", "times_correct"]

    @staticmethod
    def _create_or_refresh_contribution(question, user):
        contribution, created = Contribution.objects.get_or_create(
            user=user,
            question=question,
            defaults={
                "contribution_month": timezone.now().month,
                "contribution_year": timezone.now().year,
                "status": "PENDING",
            },
        )
        if not created and contribution.status == "REJECTED":
            contribution.status = "PENDING"
            contribution.rejection_reason = None
            contribution.contribution_month = timezone.now().month
            contribution.contribution_year = timezone.now().year
            contribution.save(
                update_fields=[
                    "status",
                    "rejection_reason",
                    "contribution_month",
                    "contribution_year",
                ]
            )

    @staticmethod
    def _normalize_key(value):
        return re.sub(r"_+", "_", re.sub(r"[^a-z0-9]+", "_", value.lower())).strip(
            "_"
        )

    @staticmethod
    def _as_text(value):
        if value is None:
            return ""
        if isinstance(value, float) and value.is_integer():
            return str(int(value))
        return str(value).strip()

    @staticmethod
    def _as_bool(value):
        if isinstance(value, bool):
            return value
        return str(value).strip().lower() in {"1", "true", "yes", "y"}

    def _normalized_row(self, row):
        normalized = {}
        for key, value in row.items():
            normalized[self._normalize_key(str(key))] = value
        return normalized

    def _first_non_empty(self, row, keys):
        for key in keys:
            value = row.get(key)
            if value is None:
                continue
            text = self._as_text(value)
            if text:
                return text
        return ""

    def _read_rows_from_csv(self, file_bytes):
        try:
            text = file_bytes.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise ValueError(
                "CSV must be UTF-8 encoded."
            ) from exc
        reader = csv.DictReader(io.StringIO(text))
        if not reader.fieldnames:
            raise ValueError("CSV file is missing a header row.")
        return list(reader)

    def _read_rows_from_excel(self, file_bytes, extension):
        if extension == ".xlsx":
            try:
                import openpyxl
            except ImportError as exc:
                raise ValueError(
                    "Excel upload requires 'openpyxl' to be installed."
                ) from exc
            workbook = openpyxl.load_workbook(
                io.BytesIO(file_bytes),
                data_only=True,
                read_only=True,
            )
            sheet = workbook.active
            raw_rows = sheet.iter_rows(values_only=True)
            headers = next(raw_rows, None)
            if not headers:
                raise ValueError("Excel file is empty.")
            normalized_headers = [self._as_text(h) for h in headers]
            rows = []
            for raw_row in raw_rows:
                if not raw_row or all(cell in (None, "") for cell in raw_row):
                    continue
                row = {
                    normalized_headers[idx]: raw_row[idx]
                    for idx in range(len(normalized_headers))
                }
                rows.append(row)
            return rows

        if extension == ".xls":
            try:
                import xlrd
            except ImportError as exc:
                raise ValueError(
                    "Legacy .xls upload requires 'xlrd' to be installed."
                ) from exc
            workbook = xlrd.open_workbook(file_contents=file_bytes)
            sheet = workbook.sheet_by_index(0)
            if sheet.nrows == 0:
                raise ValueError("Excel file is empty.")
            headers = [self._as_text(sheet.cell_value(0, c)) for c in range(sheet.ncols)]
            rows = []
            for row_idx in range(1, sheet.nrows):
                values = [sheet.cell_value(row_idx, c) for c in range(sheet.ncols)]
                if all(v in ("", None) for v in values):
                    continue
                rows.append({headers[idx]: values[idx] for idx in range(len(headers))})
            return rows

        raise ValueError("Unsupported Excel file extension.")

    def _parse_pdf_blocks(self, text):
        cleaned = text.replace("\r", "\n")
        question_start_pattern = re.compile(
            r"(?m)^\s*(?:Q(?:uestion)?\s*\d*[:.)-]|\d+[.)])\s*"
        )
        starts = list(question_start_pattern.finditer(cleaned))
        if not starts:
            raise ValueError(
                "No questions detected in PDF. Use lines like 'Q1:' followed by A/B/C/D."
            )

        rows = []
        for idx, match in enumerate(starts):
            block_start = match.start()
            block_end = starts[idx + 1].start() if idx + 1 < len(starts) else len(
                cleaned
            )
            block = cleaned[block_start:block_end].strip()
            if not block:
                continue
            row = self._parse_single_pdf_block(block)
            if row:
                rows.append(row)

        if not rows:
            raise ValueError("Could not parse any valid question blocks from PDF.")
        return rows

    def _parse_single_pdf_block(self, block):
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if not lines:
            return None

        first_line = re.sub(
            r"^\s*(?:Q(?:uestion)?\s*\d*[:.)-]|\d+[.)])\s*",
            "",
            lines[0],
            flags=re.IGNORECASE,
        ).strip()
        question_text = first_line
        explanation = ""
        options = {"A": "", "B": "", "C": "", "D": ""}
        correct_answer = ""
        current_section = "question"
        current_option = None

        for line in lines[1:]:
            option_match = re.match(r"^([A-D])[\).:\-]\s*(.+)$", line, re.IGNORECASE)
            if option_match:
                current_option = option_match.group(1).upper()
                options[current_option] = option_match.group(2).strip()
                current_section = "options"
                continue

            answer_match = re.match(
                r"^(?:answer|correct(?:\s*answer|\s*option)?|ans)[:\-]\s*(.+)$",
                line,
                re.IGNORECASE,
            )
            if answer_match:
                correct_answer = answer_match.group(1).strip()
                current_section = "answer"
                continue

            explanation_match = re.match(
                r"^(?:explanation|note|reason)[:\-]\s*(.+)$",
                line,
                re.IGNORECASE,
            )
            if explanation_match:
                explanation = explanation_match.group(1).strip()
                current_section = "explanation"
                continue

            if current_section == "question":
                question_text = f"{question_text} {line}".strip()
            elif current_section == "options" and current_option:
                options[current_option] = f"{options[current_option]} {line}".strip()
            elif current_section == "explanation":
                explanation = f"{explanation} {line}".strip()

        normalized_correct_answer = (
            re.sub(r"[^A-D0-9]", "", correct_answer.upper())[:1] if correct_answer else ""
        )
        answer_rows = []
        for label in ("A", "B", "C", "D"):
            text = options[label]
            if text:
                answer_rows.append(
                    {
                        "answer_text_en": text,
                        "answer_text_np": text,
                        "is_correct": label == normalized_correct_answer,
                    }
                )

        if not question_text:
            raise ValueError("Missing question text.")
        if not answer_rows:
            raise ValueError("Missing answer options (A/B/C/D).")
        if not any(answer["is_correct"] for answer in answer_rows):
            raise ValueError("Missing correct answer marker (e.g., 'Answer: A').")

        return {
            "question_text_en": question_text,
            "question_text_np": question_text,
            "explanation_en": explanation,
            "explanation_np": explanation,
            "answers": answer_rows,
        }

    def _read_rows_from_pdf(self, file_bytes):
        try:
            from pypdf import PdfReader
        except ImportError as exc:
            raise ValueError("PDF upload requires 'pypdf' to be installed.") from exc

        reader = PdfReader(io.BytesIO(file_bytes))
        text = "\n".join((page.extract_text() or "") for page in reader.pages)
        if not text.strip():
            raise ValueError("PDF appears empty or contains no extractable text.")
        return self._parse_pdf_blocks(text)

    def _parse_uploaded_rows(self, uploaded_file):
        file_name = uploaded_file.name or ""
        extension = Path(file_name).suffix.lower()
        file_bytes = uploaded_file.read()

        if extension == ".pdf":
            return self._read_rows_from_pdf(file_bytes)

        if extension in {".xlsx", ".xls"}:
            return self._read_rows_from_excel(file_bytes, extension)

        if extension == ".csv" or uploaded_file.content_type in {
            "text/csv",
            "application/csv",
        }:
            return self._read_rows_from_csv(file_bytes)

        raise ValueError(
            "Unsupported file type. Allowed formats: .pdf, .xlsx, .xls, .csv."
        )

    def _parse_answers_from_row(self, row):
        answers = []
        raw_answers = row.get("answers")
        if isinstance(raw_answers, list):
            for idx, item in enumerate(raw_answers, start=1):
                answers.append(
                    {
                        "answer_text_en": self._as_text(
                            item.get("answer_text_en")
                            or item.get("answer_en")
                            or item.get("text_en")
                            or item.get("text")
                        ),
                        "answer_text_np": self._as_text(
                            item.get("answer_text_np")
                            or item.get("answer_np")
                            or item.get("text_np")
                            or item.get("text")
                        ),
                        "is_correct": self._as_bool(item.get("is_correct")),
                        "display_order": idx,
                    }
                )
        elif self._as_text(raw_answers):
            try:
                parsed = json.loads(self._as_text(raw_answers))
            except json.JSONDecodeError as exc:
                raise ValueError("Invalid JSON in 'answers' column.") from exc
            if not isinstance(parsed, list):
                raise ValueError("'answers' column must be a JSON list.")
            for idx, item in enumerate(parsed, start=1):
                answers.append(
                    {
                        "answer_text_en": self._as_text(
                            item.get("answer_text_en")
                            or item.get("answer_en")
                            or item.get("text_en")
                            or item.get("text")
                        ),
                        "answer_text_np": self._as_text(
                            item.get("answer_text_np")
                            or item.get("answer_np")
                            or item.get("text_np")
                            or item.get("text")
                        ),
                        "is_correct": self._as_bool(item.get("is_correct")),
                        "display_order": idx,
                    }
                )
        else:
            labels = ["a", "b", "c", "d"]
            for idx, label in enumerate(labels, start=1):
                answer_en = self._first_non_empty(
                    row,
                    [
                        f"answer_{idx}_en",
                        f"answer{idx}_en",
                        f"option_{label}_en",
                        f"option_{idx}_en",
                        f"answer_{idx}",
                        f"option_{idx}",
                        f"option_{label}",
                    ],
                )
                answer_np = self._first_non_empty(
                    row,
                    [
                        f"answer_{idx}_np",
                        f"answer{idx}_np",
                        f"option_{label}_np",
                        f"option_{idx}_np",
                    ],
                )
                if not answer_en and not answer_np:
                    continue
                answers.append(
                    {
                        "answer_text_en": answer_en or answer_np,
                        "answer_text_np": answer_np or answer_en,
                        "is_correct": self._as_bool(
                            self._first_non_empty(
                                row,
                                [
                                    f"is_correct_{idx}",
                                    f"correct_{idx}",
                                    f"option_{label}_correct",
                                ],
                            )
                        ),
                        "display_order": idx,
                    }
                )

        if not answers:
            raise ValueError("No answers found. Provide 'answers' JSON or answer columns.")

        correct_marker = self._first_non_empty(
            row,
            ["correct_answer", "correct_option", "correct", "answer_key"],
        )
        if correct_marker:
            marker = correct_marker.strip().upper()
            index_map = {"A": 1, "B": 2, "C": 3, "D": 4}
            target_order = None
            if marker.isdigit():
                target_order = int(marker)
            elif marker in index_map:
                target_order = index_map[marker]
            else:
                for ans in answers:
                    if marker in {
                        ans["answer_text_en"].strip().upper(),
                        ans["answer_text_np"].strip().upper(),
                    }:
                        target_order = ans["display_order"]
                        break
            if not target_order:
                raise ValueError(f"Invalid correct_answer value '{correct_marker}'.")
            for ans in answers:
                ans["is_correct"] = ans["display_order"] == target_order

        correct_count = sum(1 for ans in answers if ans["is_correct"])
        if correct_count != 1:
            raise ValueError("Exactly one correct answer is required.")

        for ans in answers:
            if not ans["answer_text_en"] and not ans["answer_text_np"]:
                raise ValueError("Answer text cannot be empty.")
            if not ans["answer_text_en"]:
                ans["answer_text_en"] = ans["answer_text_np"]
            if not ans["answer_text_np"]:
                ans["answer_text_np"] = ans["answer_text_en"]
        return answers

    def _build_question_payload(self, row):
        normalized_row = self._normalized_row(row)
        question_text_en = self._first_non_empty(
            normalized_row,
            ["question_text_en", "question_en", "question"],
        )
        question_text_np = self._first_non_empty(
            normalized_row,
            ["question_text_np", "question_np", "question_nepali"],
        )
        explanation_en = self._first_non_empty(
            normalized_row,
            ["explanation_en", "explanation", "explain_en"],
        )
        explanation_np = self._first_non_empty(
            normalized_row,
            ["explanation_np", "explain_np", "explanation_nepali"],
        )
        difficulty = self._first_non_empty(
            normalized_row,
            ["difficulty_level", "difficulty"],
        ).upper()

        if not question_text_en:
            raise ValueError("question_text_en is required.")

        if difficulty and difficulty not in {"EASY", "MEDIUM", "HARD"}:
            raise ValueError(f"Invalid difficulty_level '{difficulty}'.")

        answers = self._parse_answers_from_row(normalized_row)
        return {
            "question_text_en": question_text_en,
            "question_text_np": question_text_np or question_text_en,
            "explanation_en": explanation_en,
            "explanation_np": explanation_np or explanation_en,
            "difficulty_level": difficulty or "MEDIUM",
            "answers": answers,
        }

    def perform_create(self, serializer):
        question = serializer.save(created_by=self.request.user)
        # Auto-create a Contribution record so the user's contributions are tracked

        self._create_or_refresh_contribution(question=question, user=self.request.user)

    def perform_update(self, serializer):
        question = serializer.save()
        # check if this question have rejected contribution record
        try:
            contribution = Contribution.objects.get(
                question=question, user=self.request.user
            )

            if contribution.status == "REJECTED":
                contribution.status = "PENDING"
                contribution.rejection_reason = None
                contribution.contribution_month = timezone.now().month
                contribution.contribution_year = timezone.now().year

                contribution.save(
                    update_fields=[
                        "status",
                        "rejection_reason",
                        "contribution_month",
                        "contribution_year",
                    ]
                )

        except Contribution.DoesNotExist:
            pass

    def get_queryset(self):
        # Allow users to see their own non-public questions
        if self.request.user.is_authenticated:
            return Question.objects.filter(status="PUBLIC") | Question.objects.filter(
                created_by=self.request.user
            )
        return Question.objects.filter(status="PUBLIC")

    @action(
        detail=False,
        methods=["post"],
        url_path="bulk-upload",
        parser_classes=[MultiPartParser],
    )
    def bulk_upload(self, request):
        """
        Upload questions in bulk from PDF/Excel/CSV.
        Each parsed question creates both Question and Contribution records.
        """
        uploaded_file = request.FILES.get("file")
        category_id = request.data.get("category")

        if not uploaded_file or not category_id:
            return Response(
                {"detail": "file and category are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from src.models.branch import Category

        try:
            category = Category.objects.get(pk=category_id)
        except Category.DoesNotExist:
            return Response(
                {"detail": "Category not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            rows = self._parse_uploaded_rows(uploaded_file)
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = []
        errors = []

        for i, row in enumerate(rows, start=1):
            try:
                payload = self._build_question_payload(row)
                with transaction.atomic():
                    question = Question.objects.create(
                        question_text_en=payload["question_text_en"],
                        question_text_np=payload["question_text_np"],
                        explanation_en=payload["explanation_en"],
                        explanation_np=payload["explanation_np"],
                        difficulty_level=payload["difficulty_level"],
                        category=category,
                        created_by=request.user,
                        consent_given=True,
                        status="DRAFT",
                    )
                    answer_objects = [
                        Answer(
                            question=question,
                            answer_text_en=ans["answer_text_en"],
                            answer_text_np=ans["answer_text_np"],
                            is_correct=ans["is_correct"],
                            display_order=ans["display_order"],
                        )
                        for ans in payload["answers"]
                    ]
                    Answer.objects.bulk_create(answer_objects)
                    self._create_or_refresh_contribution(
                        question=question,
                        user=request.user,
                    )
                created.append(question.pk)
            except Exception as e:
                errors.append(f"Row {i}: {e}")

        return Response(
            {
                "success": len(errors) == 0,
                "uploaded_count": len(created),
                "failed_count": len(errors),
                "errors": errors,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST,
        )

    @action(detail=True, methods=["post"])
    def consent(self, request, pk=None):
        """
        Give consent for publication.
        """
        question = self.get_object()
        if question.created_by != request.user:
            return Response(
                {"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN
            )

        question.consent_given = True
        question.save(update_fields=["consent_given"])
        return Response({"status": "consent given"})


class QuestionReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Question Reports.
    Users can create reports.
    Admins can view/manage.
    """

    queryset = QuestionReport.objects.all().order_by("-created_at")
    serializer_class = QuestionReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)

    def get_queryset(self):
        # Regular users should only see their own reports? Or maybe none?
        # Usually reports are fire-and-forget for users, but seeing history is good.
        if self.request.user.is_staff:
            return QuestionReport.objects.all()
        return QuestionReport.objects.filter(reported_by=self.request.user)
