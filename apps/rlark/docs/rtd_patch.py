"""Patch mkdocs.yml with build_only_locale and language switcher for ReadTheDocs."""
import re
import os

lang = os.environ.get("READTHEDOCS_LANGUAGE", "en")
# Normalize: RTD uses "zh-cn" but i18n plugin expects "zh"
if lang == "zh-cn":
    lang = "zh"

config_path = "apps/rlark/mkdocs.yml"

with open(config_path) as f:
    content = f.read()

# Inject build_only_locale
content = re.sub(
    r"(docs_structure: folder\n)",
    rf"\1      build_only_locale: {lang}\n",
    content,
)

# Inject language switcher (extra.alternate) for cross-project links on RTD
alternate_block = rf"""
extra:
  alternate:
    - name: English
      link: https://rlark-ci-test.readthedocs.io/en/latest/
      lang: en
    - name: 中文
      link: https://rlark-ci-test.readthedocs.io/zh/latest/
      lang: zh
"""

# Remove existing extra.alternate if present, then inject new one
content = re.sub(r"\n# .*navigation\.instant.*\n", "\n", content)
content = content.rstrip() + "\n" + alternate_block

with open(config_path, "w") as f:
    f.write(content)

print(f"[i18n] build_only_locale={lang}")