"""
Nepal-specific data pools and constants for PSC exam seed data.
"""

# Category color palette
COLORS = {
    "green": "#4CAF50",
    "blue": "#2196F3",
    "orange": "#FF9800",
    "purple": "#9C27B0",
    "pink": "#E91E63",
    "cyan": "#00BCD4",
    "deep_orange": "#FF5722",
    "brown": "#795548",
    "blue_grey": "#607D8B",
    "indigo": "#3F51B5",
    "teal": "#009688",
    "light_green": "#8BC34A",
    "amber": "#FFC107",
    "red": "#F44336",
    "lime": "#CDDC39",
    "deep_purple": "#673AB7",
    "yellow": "#FFEB3B",
}

# Nepal's 77 districts
DISTRICTS = [
    "Taplejung", "Panchthar", "Ilam", "Jhapa", "Morang", "Sunsari", "Dhankuta",
    "Terhathum", "Sankhuwasabha", "Bhojpur", "Solukhumbu", "Okhaldhunga",
    "Khotang", "Udayapur", "Saptari", "Siraha", "Dhanusha", "Mahottari",
    "Sarlahi", "Sindhuli", "Ramechhap", "Dolakha", "Sindhupalchok", "Kavrepalanchok",
    "Lalitpur", "Bhaktapur", "Kathmandu", "Nuwakot", "Rasuwa", "Dhading",
    "Makwanpur", "Rautahat", "Bara", "Parsa", "Chitwan", "Gorkha", "Lamjung",
    "Tanahun", "Syangja", "Kaski", "Manang", "Mustang", "Myagdi", "Parbat",
    "Baglung", "Gulmi", "Palpa", "Nawalparasi East", "Rupandehi", "Kapilvastu",
    "Arghakhanchi", "Pyuthan", "Rolpa", "Rukum East", "Salyan", "Dang",
    "Banke", "Bardiya", "Surkhet", "Dailekh", "Jajarkot", "Dolpa", "Jumla",
    "Kalikot", "Mugu", "Humla", "Rukum West", "Nawalparasi West",
    "Bajura", "Bajhang", "Achham", "Doti", "Kailali", "Kanchanpur",
    "Dadeldhura", "Baitadi", "Darchula",
]

# Nepal's 7 provinces
PROVINCES = [
    {"en": "Koshi Province", "np": "कोशी प्रदेश", "capital": "Biratnagar"},
    {"en": "Madhesh Province", "np": "मधेश प्रदेश", "capital": "Janakpur"},
    {"en": "Bagmati Province", "np": "बागमती प्रदेश", "capital": "Hetauda"},
    {"en": "Gandaki Province", "np": "गण्डकी प्रदेश", "capital": "Pokhara"},
    {"en": "Lumbini Province", "np": "लुम्बिनी प्रदेश", "capital": "Deukhuri"},
    {"en": "Karnali Province", "np": "कर्णाली प्रदेश", "capital": "Birendranagar"},
    {"en": "Sudurpashchim Province", "np": "सुदूरपश्चिम प्रदेश", "capital": "Godawari"},
]

# Major rivers of Nepal
RIVERS = [
    {"en": "Koshi", "np": "कोशी"},
    {"en": "Gandaki", "np": "गण्डकी"},
    {"en": "Karnali", "np": "कर्णाली"},
    {"en": "Mahakali", "np": "महाकाली"},
    {"en": "Bagmati", "np": "बागमती"},
    {"en": "Rapti", "np": "राप्ती"},
    {"en": "Narayani", "np": "नारायणी"},
    {"en": "Mechi", "np": "मेची"},
    {"en": "Kamala", "np": "कमला"},
    {"en": "Babai", "np": "बबई"},
    {"en": "Bheri", "np": "भेरी"},
    {"en": "Seti", "np": "सेती"},
    {"en": "Tamor", "np": "तामोर"},
    {"en": "Trishuli", "np": "त्रिशूली"},
]

# Mountains / Peaks
MOUNTAINS = [
    {"en": "Mount Everest", "np": "सगरमाथा", "height": "8,848.86m"},
    {"en": "Kangchenjunga", "np": "कञ्चनजङ्घा", "height": "8,586m"},
    {"en": "Lhotse", "np": "ल्होत्से", "height": "8,516m"},
    {"en": "Makalu", "np": "मकालु", "height": "8,485m"},
    {"en": "Cho Oyu", "np": "चो ओयु", "height": "8,188m"},
    {"en": "Dhaulagiri", "np": "धौलागिरी", "height": "8,167m"},
    {"en": "Manaslu", "np": "मनास्लु", "height": "8,163m"},
    {"en": "Annapurna I", "np": "अन्नपूर्ण १", "height": "8,091m"},
]

# Presidents of Nepal (chronological)
PRESIDENTS = [
    {"en": "Ram Baran Yadav", "np": "रामवरण यादव", "term": "2008-2015"},
    {"en": "Bidya Devi Bhandari", "np": "विद्यादेवी भण्डारी", "term": "2015-2023"},
    {"en": "Ram Chandra Poudel", "np": "रामचन्द्र पौडेल", "term": "2023-present"},
]

# Prime Ministers (selected, post-2006)
PRIME_MINISTERS = [
    {"en": "Girija Prasad Koirala", "np": "गिरिजाप्रसाद कोइराला"},
    {"en": "Pushpa Kamal Dahal", "np": "पुष्पकमल दाहाल"},
    {"en": "Madhav Kumar Nepal", "np": "माधवकुमार नेपाल"},
    {"en": "Jhala Nath Khanal", "np": "झलनाथ खनाल"},
    {"en": "Baburam Bhattarai", "np": "बाबुराम भट्टराई"},
    {"en": "Sushil Koirala", "np": "सुशील कोइराला"},
    {"en": "KP Sharma Oli", "np": "केपी शर्मा ओली"},
    {"en": "Sher Bahadur Deuba", "np": "शेरबहादुर देउवा"},
]

# Constitutional articles (key ones for PSC exams)
CONSTITUTION_ARTICLES = [
    {"num": 1, "en": "Nepal as a State", "np": "राज्यको रूपमा नेपाल"},
    {"num": 2, "en": "Sovereignty and State Power", "np": "सार्वभौमसत्ता र राज्यसत्ता"},
    {"num": 3, "en": "Nation and Nationality", "np": "राष्ट्र र राष्ट्रियता"},
    {"num": 4, "en": "State's Territory", "np": "राज्यको सिमाना"},
    {"num": 5, "en": "National Interest", "np": "राष्ट्रिय हित"},
    {"num": 16, "en": "Right to live with dignity", "np": "मानवीय मर्यादाको अधिकार"},
    {"num": 17, "en": "Right to freedom", "np": "स्वतन्त्रताको अधिकार"},
    {"num": 18, "en": "Right to equality", "np": "समानताको अधिकार"},
    {"num": 24, "en": "Right against untouchability", "np": "छुवाछुत विरुद्धको अधिकार"},
    {"num": 25, "en": "Right relating to property", "np": "सम्पत्तिको अधिकार"},
    {"num": 26, "en": "Right to religious freedom", "np": "धार्मिक स्वतन्त्रताको अधिकार"},
    {"num": 27, "en": "Right to information", "np": "सूचनाको अधिकार"},
    {"num": 28, "en": "Right to privacy", "np": "निजी गोपनियताको अधिकार"},
    {"num": 31, "en": "Right to education", "np": "शिक्षाको अधिकार"},
    {"num": 32, "en": "Right to language and culture", "np": "भाषा र संस्कृतिको अधिकार"},
    {"num": 33, "en": "Right to employment", "np": "रोजगारीको अधिकार"},
    {"num": 34, "en": "Right to labour", "np": "श्रमको अधिकार"},
    {"num": 35, "en": "Right to health", "np": "स्वास्थ्यको अधिकार"},
    {"num": 36, "en": "Right to food", "np": "खाद्य अधिकार"},
    {"num": 37, "en": "Right to housing", "np": "आवासको अधिकार"},
    {"num": 46, "en": "Right to constitutional remedy", "np": "संवैधानिक उपचारको अधिकार"},
    {"num": 56, "en": "Structure of State", "np": "राज्यको संरचना"},
    {"num": 74, "en": "Form of Government", "np": "सरकारको स्वरूप"},
    {"num": 76, "en": "Formation of Council of Ministers", "np": "मन्त्रिपरिषद्को गठन"},
    {"num": 84, "en": "Composition of Federal Parliament", "np": "संघीय संसद्को गठन"},
    {"num": 100, "en": "President", "np": "राष्ट्रपति"},
    {"num": 104, "en": "Vice President", "np": "उपराष्ट्रपति"},
    {"num": 128, "en": "Judiciary", "np": "न्यायपालिका"},
    {"num": 232, "en": "Provincial Legislature", "np": "प्रदेश व्यवस्थापिका"},
    {"num": 274, "en": "Amendment of Constitution", "np": "संविधान संशोधन"},
]

# Nepali numeral mapping
NEPALI_DIGITS = {"0": "०", "1": "१", "2": "२", "3": "३", "4": "४",
                 "5": "५", "6": "६", "7": "७", "8": "८", "9": "९"}


def to_nepali_number(n):
    """Convert an integer to Nepali numeral string."""
    return "".join(NEPALI_DIGITS.get(c, c) for c in str(n))


# Difficulty distribution weights for generated questions
DIFFICULTY_WEIGHTS = {"EASY": 0.35, "MEDIUM": 0.45, "HARD": 0.20}

# Nepal-specific organizations
ORGANIZATIONS = [
    {"en": "Nepal Rastra Bank", "np": "नेपाल राष्ट्र बैंक"},
    {"en": "Commission for Investigation of Abuse of Authority", "np": "अख्तियार दुरुपयोग अनुसन्धान आयोग"},
    {"en": "National Planning Commission", "np": "राष्ट्रिय योजना आयोग"},
    {"en": "Election Commission Nepal", "np": "निर्वाचन आयोग"},
    {"en": "Public Service Commission", "np": "लोक सेवा आयोग"},
    {"en": "National Human Rights Commission", "np": "राष्ट्रिय मानव अधिकार आयोग"},
    {"en": "Auditor General's Office", "np": "महालेखा परीक्षकको कार्यालय"},
    {"en": "Attorney General's Office", "np": "महान्यायाधिवक्ताको कार्यालय"},
]
