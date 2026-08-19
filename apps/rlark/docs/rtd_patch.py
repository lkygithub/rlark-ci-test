"""Patch mkdocs.yml with build_only_locale for ReadTheDocs translation builds."""
import re
import os

lang = os.environ.get("READTHEDOCS_LANGUAGE", "en")
config_path = "apps/rlark/mkdocs.yml"

with open(config_path) as f:
    content = f.read()

content = re.sub(
    r"(docs_structure: folder\n)",
    rf"\1      build_only_locale: {lang}\n",
    content,
)

with open(config_path, "w") as f:
    f.write(content)

print(f"[i18n] build_only_locale={lang}")