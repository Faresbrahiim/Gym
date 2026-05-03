class IntentService:

    def detect(self, question: str) -> str:
        question_lower = question.lower().strip()

        # Salutations et conversation simple
        greetings = ["bonjour", "salut", "bonsoir", "bonne nuit", "hello", 
                     "hi", "merci", "ok", "oui", "non", "d'accord", "super",
                     "parfait", "bien", "comment vas", "ça va", "au revoir",
                     "bye", "à bientôt", "svp", "s'il vous plaît"]
        if any(word in question_lower for word in greetings):
            return "greeting"

        # Informations salle
        salle_keywords = ["horaire", "heure", "ouverture", "fermeture", "tarif", 
                          "prix", "abonnement", "règle", "règlement", "salle",
                          "inscription", "mensuel", "annuel", "trimestriel",
                          "cours collectif", "coaching personnel"]
        if any(word in question_lower for word in salle_keywords):
            return "salle_info"

        # Nutrition
        nutrition_keywords = ["repas", "manger", "alimentation", "calorie", 
                               "protéine", "glucide", "lipide", "régime", 
                               "nourriture", "petit déjeuner", "déjeuner", 
                               "dîner", "collation", "recette", "poids"]
        if any(word in question_lower for word in nutrition_keywords):
            return "nutrition"

        # Sport et coaching
        sport_keywords = ["exercice", "programme", "entraînement", "muscle", 
                          "cardio", "musculation", "séance", "sport", "squat",
                          "pompe", "traction", "course", "vélo", "hiit",
                          "débutant", "intermédiaire", "avancé", "masse",
                          "sèche", "endurance", "force", "gainage"]
        if any(word in question_lower for word in sport_keywords):
            return "coaching"

        return "general"

intent_service = IntentService()