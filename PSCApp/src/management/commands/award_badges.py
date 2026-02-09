from django.core.management.base import BaseCommand

from src.models import UserStatistics


class Command(BaseCommand):
    help = "Batch checks badge eligibility for all users"

    def handle(self, *args, **options):
        self.stdout.write("Checking badges for all users...")

        stats = UserStatistics.objects.all()
        count = 0

        for stat in stats:
            # check_badge_eligibility() saves if changes are made
            stat.check_badge_eligibility()
            count += 1
            if count % 100 == 0:
                self.stdout.write(f"Processed {count} users...")

        self.stdout.write(
            self.style.SUCCESS(f"Finished checking badges for {count} users.")
        )
