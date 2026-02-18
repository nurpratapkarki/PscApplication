"""
Parametric question generators for math, reasoning, and pattern-based questions.
Each generator returns a question dict ready for database insertion.
"""

import random

from .constants import to_nepali_number


def _wrong_numbers(correct, count=3, spread=None):
    """Generate plausible wrong answers near the correct value."""
    if spread is None:
        spread = max(abs(correct) // 3, 3)
    wrongs = set()
    while len(wrongs) < count:
        offset = random.randint(1, spread)
        candidate = correct + random.choice([-1, 1]) * offset
        if candidate != correct and candidate not in wrongs and candidate >= 0:
            wrongs.add(candidate)
    return list(wrongs)


def _make_answers(correct, wrongs):
    """Create shuffled answer list with one correct and three wrong."""
    answers = [{"text_en": str(correct), "text_np": to_nepali_number(correct), "is_correct": True}]
    for w in wrongs[:3]:
        answers.append({"text_en": str(w), "text_np": to_nepali_number(w), "is_correct": False})
    random.shuffle(answers)
    return answers


def generate_percentage_question():
    base = random.choice([100, 150, 200, 250, 300, 400, 500, 600, 800, 1000])
    percent = random.choice([5, 10, 15, 20, 25, 30, 40, 50, 60, 75])
    correct = int(base * percent / 100)
    wrongs = _wrong_numbers(correct)
    return {
        "question_text_en": f"What is {percent}% of {base}?",
        "question_text_np": f"{to_nepali_number(base)} को {to_nepali_number(percent)}% कति हुन्छ?",
        "answers": _make_answers(correct, wrongs),
        "explanation_en": f"{percent}% of {base} = {base} × {percent}/100 = {correct}",
        "explanation_np": f"{to_nepali_number(base)} को {to_nepali_number(percent)}% = {to_nepali_number(base)} × {to_nepali_number(percent)}/१०० = {to_nepali_number(correct)}",
        "difficulty": "EASY",
        "source_reference": "PSC Quantitative Aptitude",
    }


def generate_arithmetic_series():
    start = random.randint(1, 10)
    diff = random.randint(2, 8)
    series = [start + i * diff for i in range(5)]
    answer = series[-1]
    display = series[:-1]
    wrongs = _wrong_numbers(answer)
    s_en = ", ".join(str(x) for x in display)
    s_np = ", ".join(to_nepali_number(x) for x in display)
    return {
        "question_text_en": f"What comes next in the series: {s_en}, ?",
        "question_text_np": f"श्रृंखलामा अर्को के आउँछ: {s_np}, ?",
        "answers": _make_answers(answer, wrongs),
        "explanation_en": f"This is an arithmetic series with common difference {diff}. Next term = {display[-1]} + {diff} = {answer}.",
        "explanation_np": f"यो {to_nepali_number(diff)} को सामान्य भिन्नतासँगको अंकगणितीय श्रृंखला हो। अर्को पद = {to_nepali_number(display[-1])} + {to_nepali_number(diff)} = {to_nepali_number(answer)}।",
        "difficulty": "EASY",
        "source_reference": "PSC Reasoning",
    }


def generate_geometric_series():
    start = random.choice([1, 2, 3])
    ratio = random.choice([2, 3, 4])
    series = [start * (ratio ** i) for i in range(5)]
    answer = series[-1]
    display = series[:-1]
    wrongs = _wrong_numbers(answer)
    s_en = ", ".join(str(x) for x in display)
    s_np = ", ".join(to_nepali_number(x) for x in display)
    return {
        "question_text_en": f"Find the next term: {s_en}, ?",
        "question_text_np": f"अर्को पद पत्ता लगाउनुहोस्: {s_np}, ?",
        "answers": _make_answers(answer, wrongs),
        "explanation_en": f"This is a geometric series with common ratio {ratio}. Next = {display[-1]} × {ratio} = {answer}.",
        "explanation_np": f"यो {to_nepali_number(ratio)} को सामान्य अनुपातसँगको गुणोत्तर श्रृंखला हो। अर्को = {to_nepali_number(display[-1])} × {to_nepali_number(ratio)} = {to_nepali_number(answer)}।",
        "difficulty": "MEDIUM",
        "source_reference": "PSC Reasoning",
    }


def generate_profit_loss_question():
    cp = random.choice([100, 200, 250, 400, 500, 800, 1000])
    percent = random.choice([10, 15, 20, 25, 30, 50])
    is_profit = random.choice([True, False])
    if is_profit:
        sp = int(cp * (100 + percent) / 100)
        q_en = f"An item bought for Rs. {cp} is sold at {percent}% profit. What is the selling price?"
        q_np = f"रु. {to_nepali_number(cp)} मा किनेको वस्तु {to_nepali_number(percent)}% नाफामा बेच्दा बिक्री मूल्य कति हुन्छ?"
        e_en = f"SP = CP + Profit = {cp} + {cp}×{percent}/100 = {cp} + {int(cp*percent/100)} = {sp}"
    else:
        sp = int(cp * (100 - percent) / 100)
        q_en = f"An item bought for Rs. {cp} is sold at {percent}% loss. What is the selling price?"
        q_np = f"रु. {to_nepali_number(cp)} मा किनेको वस्तु {to_nepali_number(percent)}% नोक्सानमा बेच्दा बिक्री मूल्य कति हुन्छ?"
        e_en = f"SP = CP - Loss = {cp} - {cp}×{percent}/100 = {cp} - {int(cp*percent/100)} = {sp}"

    wrongs = _wrong_numbers(sp)
    return {
        "question_text_en": q_en,
        "question_text_np": q_np,
        "answers": _make_answers(sp, wrongs),
        "explanation_en": e_en,
        "explanation_np": e_en,
        "difficulty": "MEDIUM",
        "source_reference": "PSC Quantitative Aptitude",
    }


def generate_simple_interest_question():
    principal = random.choice([1000, 2000, 5000, 10000, 20000])
    rate = random.choice([5, 8, 10, 12, 15])
    time = random.choice([1, 2, 3, 4, 5])
    si = int(principal * rate * time / 100)
    wrongs = _wrong_numbers(si)
    return {
        "question_text_en": f"Find the simple interest on Rs. {principal} at {rate}% per annum for {time} year(s).",
        "question_text_np": f"रु. {to_nepali_number(principal)} को {to_nepali_number(rate)}% वार्षिक दरमा {to_nepali_number(time)} वर्षको साधारण ब्याज पत्ता लगाउनुहोस्।",
        "answers": _make_answers(si, wrongs),
        "explanation_en": f"SI = P×R×T/100 = {principal}×{rate}×{time}/100 = {si}",
        "explanation_np": f"साधारण ब्याज = मूलधन×दर×समय/१०० = {to_nepali_number(principal)}×{to_nepali_number(rate)}×{to_nepali_number(time)}/१०० = {to_nepali_number(si)}",
        "difficulty": "MEDIUM",
        "source_reference": "PSC Quantitative Aptitude",
    }


def generate_ratio_question():
    a = random.randint(2, 8)
    b = random.randint(2, 8)
    while a == b:
        b = random.randint(2, 8)
    total = random.choice([100, 200, 300, 500, 1000])
    share_a = int(total * a / (a + b))
    wrongs = _wrong_numbers(share_a)
    return {
        "question_text_en": f"Rs. {total} is divided between A and B in the ratio {a}:{b}. What is A's share?",
        "question_text_np": f"रु. {to_nepali_number(total)} लाई A र B बीच {to_nepali_number(a)}:{to_nepali_number(b)} को अनुपातमा बाँड्दा A को हिस्सा कति हुन्छ?",
        "answers": _make_answers(share_a, wrongs),
        "explanation_en": f"A's share = {total} × {a}/({a}+{b}) = {total} × {a}/{a+b} = {share_a}",
        "explanation_np": f"A को हिस्सा = {to_nepali_number(total)} × {to_nepali_number(a)}/({to_nepali_number(a)}+{to_nepali_number(b)}) = {to_nepali_number(share_a)}",
        "difficulty": "EASY",
        "source_reference": "PSC Quantitative Aptitude",
    }


def generate_average_question():
    count = random.choice([3, 4, 5, 6])
    avg = random.randint(10, 50)
    total = avg * count
    wrongs = _wrong_numbers(total)
    return {
        "question_text_en": f"The average of {count} numbers is {avg}. What is the sum of all numbers?",
        "question_text_np": f"{to_nepali_number(count)} वटा संख्याको औसत {to_nepali_number(avg)} छ। सबै संख्याको योगफल कति हुन्छ?",
        "answers": _make_answers(total, wrongs),
        "explanation_en": f"Sum = Average × Count = {avg} × {count} = {total}",
        "explanation_np": f"योगफल = औसत × संख्या = {to_nepali_number(avg)} × {to_nepali_number(count)} = {to_nepali_number(total)}",
        "difficulty": "EASY",
        "source_reference": "PSC Quantitative Aptitude",
    }


def generate_age_problem():
    age_now = random.randint(20, 40)
    years = random.choice([3, 4, 5, 6, 8, 10])
    future_age = age_now + years
    wrongs = _wrong_numbers(future_age)
    return {
        "question_text_en": f"Ram's present age is {age_now} years. What will be his age after {years} years?",
        "question_text_np": f"रामको हालको उमेर {to_nepali_number(age_now)} वर्ष छ। {to_nepali_number(years)} वर्षपछि उनको उमेर कति हुन्छ?",
        "answers": _make_answers(future_age, wrongs),
        "explanation_en": f"Age after {years} years = {age_now} + {years} = {future_age}",
        "explanation_np": f"{to_nepali_number(years)} वर्षपछि उमेर = {to_nepali_number(age_now)} + {to_nepali_number(years)} = {to_nepali_number(future_age)}",
        "difficulty": "EASY",
        "source_reference": "PSC Quantitative Aptitude",
    }


def generate_time_work_question():
    a_days = random.choice([6, 8, 10, 12, 15, 20])
    b_days = random.choice([10, 12, 15, 20, 24, 30])
    while a_days == b_days:
        b_days = random.choice([10, 12, 15, 20, 24, 30])
    # Together: 1/a + 1/b = (a+b)/(a*b)
    numerator = a_days * b_days
    denominator = a_days + b_days
    # Simplify to a reasonable answer
    if numerator % denominator == 0:
        together = numerator // denominator
        wrongs = _wrong_numbers(together)
        return {
            "question_text_en": f"A can do a work in {a_days} days and B can do it in {b_days} days. In how many days can they finish the work together?",
            "question_text_np": f"A ले एक काम {to_nepali_number(a_days)} दिनमा र B ले {to_nepali_number(b_days)} दिनमा गर्न सक्छ। दुवैले सँगै कति दिनमा काम सक्छन्?",
            "answers": _make_answers(together, wrongs),
            "explanation_en": f"Together = (A×B)/(A+B) = ({a_days}×{b_days})/({a_days}+{b_days}) = {numerator}/{denominator} = {together} days",
            "explanation_np": f"सँगै = (A×B)/(A+B) = ({to_nepali_number(a_days)}×{to_nepali_number(b_days)})/({to_nepali_number(a_days)}+{to_nepali_number(b_days)}) = {to_nepali_number(together)} दिन",
            "difficulty": "HARD",
            "source_reference": "PSC Quantitative Aptitude",
        }
    # Fallback: generate simpler question
    return generate_ratio_question()


# All generators grouped by category
QUANT_GENERATORS = [
    generate_percentage_question,
    generate_profit_loss_question,
    generate_simple_interest_question,
    generate_ratio_question,
    generate_average_question,
    generate_age_problem,
    generate_time_work_question,
]

REASONING_GENERATORS = [
    generate_arithmetic_series,
    generate_geometric_series,
]
