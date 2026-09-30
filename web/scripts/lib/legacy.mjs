// 従来の wiki/pages 形式（Jinja）のファイル内容。
export function buildLegacyFile({ title, lead, html }) {
  return `{% extends "layout.html" %}

{% block title %}${title ?? ""}{% endblock %}
{% block lead %}${lead ?? ""}{% endblock %}

{% block page_content %}

${html}
{% endblock %}
`;
}
