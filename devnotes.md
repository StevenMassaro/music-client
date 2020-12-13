### Recovering from a sync that failed halfway
This seems to occur in low memory environments sometimes.

This script will replace all files prefixed with `1607018973865_`. Replace that with whatever the prefix is that needs to be replaced.
```
for f in 1607018973865_*; do mv "$f" "${f#1607018973865_}"; done
```