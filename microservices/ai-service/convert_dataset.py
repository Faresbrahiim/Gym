import json
import os

# Lire le fichier dataset
with open("data_salle.json", encoding="utf-8") as f:
    data = json.load(f)

# Créer les dossiers
os.makedirs("data/rag_documents/nutrition", exist_ok=True)
os.makedirs("data/rag_documents/sport", exist_ok=True)

# Traiter chaque catégorie
categories = list(data.keys())
print(f"Catégories trouvées : {categories}")

total = 0
for categorie, items in data.items():
    for item in items:
        doc_id = item.get("id", f"{categorie}_{total}")
        filepath = f"data/rag_documents/{categorie}/{doc_id}.json"
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump({
                "titre": item.get("titre", item.get("title", "")),
                "categorie": categorie,
                "contenu": item.get("contenu", item.get("content", ""))
            }, f, ensure_ascii=False, indent=2)
        
        print(f"Créé : {filepath}")
        total += 1

print(f"\nConversion terminée ! {total} documents créés.")