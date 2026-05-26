import re

from app.config.parser_config import SECTION_KEYS


_MARKER = re.compile(r"^##SECTION:([a-z_]+)##$")


def split_into_sections(marked_text: str) -> dict[str, str]:
    buffers = {key: [] for key in SECTION_KEYS}
    current_section = "other"

    for raw_line in marked_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        marker_match = _MARKER.match(line)
        if marker_match:
            label = marker_match.group(1)
            current_section = label if label in SECTION_KEYS else "other"
            continue

        buffers[current_section].append(line)

    return {key: "\n".join(buffers[key]).strip() for key in SECTION_KEYS}