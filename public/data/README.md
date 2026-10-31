# Data directory

Public, version-controlled datasets will live here. Each dataset should include source URLs, retrieval dates, units, and confidence/quality notes. Automated changes should be proposed for human review rather than silently published.

Catalogue history is generated under `public/data/history/`. See [the history format and workflow](../../docs/catalogue-history.md).

Automated refreshes are orchestrated by the [data refresh workflow](../../.github/workflows/refresh-data.yml). Only validated collector output is proposed through a pull request; sources without reliable automated interfaces remain manual-review inputs. See [the refresh architecture](../../docs/data-refresh.md).
