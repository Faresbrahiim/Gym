class PromptBuilder:
    def build(self, profil: dict, docs: list[str], question: str, intent: str = "general") -> str:
        docs_text = "\n\n---\n\n".join(docs) if docs else ""

        if intent == "greeting":
            prenom = profil.get("firstName", "cher membre")
            return f"""Tu es un coach sportif sympathique.
L'utilisateur te dit : "{question}"
Reponds de maniere courte, chaleureuse et naturelle.
Mentionne que tu es la pour aider avec le sport et la nutrition.
Prenom de l'utilisateur : {prenom}"""

        if intent == "salle_info":
            return f"""Tu es le coach de cette salle de sport.

=== INFORMATIONS DE LA SALLE ===
{docs_text}

=== QUESTION ===
{question}

Reponds en utilisant uniquement les informations de la salle ci-dessus.
Si l'information n'est pas disponible, dis-le clairement."""

        return f"""Tu es un coach sportif et nutritionniste expert.

=== PROFIL DE L'UTILISATEUR ===
Prenom : {profil.get('firstName', 'N/A')}
Age : {profil.get('age', 'N/A')} ans
Poids : {profil.get('weight_kg', 'N/A')} kg
Taille : {profil.get('height_cm', 'N/A')} cm
Objectif : {profil.get('fitness_goal', 'N/A')}
Niveau : {profil.get('experience_level', 'N/A')}

=== DOCUMENTS DE REFERENCE ===
{docs_text}

=== QUESTION ===
{question}

Reponds en francais. Sois precis et personnalise selon le profil.
Utilise les documents de reference pour appuyer tes recommandations."""
