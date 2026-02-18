from .general_knowledge import QUESTIONS as GENERAL_KNOWLEDGE
from .constitution import QUESTIONS as CONSTITUTION
from .current_affairs import QUESTIONS as CURRENT_AFFAIRS
from .lok_sewa import QUESTIONS as LOK_SEWA
from .nepali_language import QUESTIONS as NEPALI_LANGUAGE
from .english_language import QUESTIONS as ENGLISH_LANGUAGE
from .quantitative_aptitude import QUESTIONS as QUANTITATIVE_APTITUDE
from .reasoning import QUESTIONS as REASONING
from .computer_knowledge import QUESTIONS as COMPUTER_KNOWLEDGE
from .governance_ethics import QUESTIONS as GOVERNANCE_ETHICS
from .geography import QUESTIONS as GEOGRAPHY
from .history import QUESTIONS as HISTORY
from .administrative import QUESTIONS as ADMINISTRATIVE
from .engineering import QUESTIONS as ENGINEERING
from .health import QUESTIONS as HEALTH
from .education import QUESTIONS as EDUCATION
from .judicial import QUESTIONS as JUDICIAL
from .agriculture_forest import QUESTIONS as AGRICULTURE_FOREST

# Map category slugs to their question sets
CATEGORY_QUESTIONS = {
    # UNIVERSAL
    "general-knowledge": GENERAL_KNOWLEDGE,
    "constitution-of-nepal": CONSTITUTION,
    "current-affairs": CURRENT_AFFAIRS,
    "lok-sewa-regulations": LOK_SEWA,
    "nepali-language-grammar": NEPALI_LANGUAGE,
    "english-language": ENGLISH_LANGUAGE,
    "quantitative-aptitude": QUANTITATIVE_APTITUDE,
    "reasoning-mental-ability": REASONING,
    "computer-knowledge": COMPUTER_KNOWLEDGE,
    "good-governance-ethics": GOVERNANCE_ETHICS,
    "geography-of-nepal": GEOGRAPHY,
    "history-of-nepal": HISTORY,
    # BRANCH & SUBBRANCH - keyed by category slug
    **ADMINISTRATIVE,
    **ENGINEERING,
    **HEALTH,
    **EDUCATION,
    **JUDICIAL,
    **AGRICULTURE_FOREST,
}
