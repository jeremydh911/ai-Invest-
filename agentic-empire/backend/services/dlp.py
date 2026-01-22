from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC  # ML for PII classification
import re  # Regex for PII (SSN, emails, health data)

class DLPScanner:
    def __init__(self):
        self.vectorizer = TfidfVectorizer()
        self.classifier = SVC()  # Trained stub (in enterprise, fine-tune on PII dataset)
        # Train on sample data (production: Load from secure DB)
        X = ["sample SSN 123-45-6789", "no pii here", "health record: diabetes"]
        y = [1, 0, 1]  # 1 = PII
        X_vec = self.vectorizer.fit_transform(X)
        self.classifier.fit(X_vec, y)

    def scan(self, text: str):
        # Regex first (fast, CPU)
        if re.search(r'\b\d{3}-\d{2}-\d{4}\b|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text):
            return False  # Block PII
        # ML classify (GPU if heavy dataset)
        vec = self.vectorizer.transform([text])
        pred = self.classifier.predict(vec)
        return pred[0] == 0  # True if no PII