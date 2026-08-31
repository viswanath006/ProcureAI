import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

mig_dir = 'database/migrations'
issues = []

for fname in sorted(os.listdir(mig_dir)):
    if not fname.endswith('.sql'):
        continue
    with open(os.path.join(mig_dir, fname), 'r', encoding='utf-8') as f:
        content = f.read()

    file_issues = []

    # 1. Bare CREATE TYPE not wrapped in DO block
    stripped = re.sub(r'DO \$\$.*?END \$\$;', 'DO_BLOCK', content, flags=re.DOTALL)
    for m in re.finditer(r'CREATE TYPE \w+ AS ENUM', stripped):
        line_num = content[:m.start()].count('\n') + 1
        file_issues.append('  L%d: bare CREATE TYPE AS ENUM' % line_num)

    # 2. Bare CREATE INDEX without IF NOT EXISTS
    for m in re.finditer(r'CREATE (?:UNIQUE )?INDEX (?!IF NOT EXISTS)', content):
        line_num = content[:m.start()].count('\n') + 1
        file_issues.append('  L%d: bare CREATE INDEX without IF NOT EXISTS' % line_num)

    # 3. Bare CREATE TABLE without IF NOT EXISTS
    for m in re.finditer(r'CREATE TABLE (?!IF NOT EXISTS)', content):
        line_num = content[:m.start()].count('\n') + 1
        snippet = content[m.start():m.start()+50].replace('\n', ' ')
        file_issues.append('  L%d: bare CREATE TABLE: %s' % (line_num, snippet))

    # 4. Bare ALTER TABLE ADD CONSTRAINT not inside DO block
    stripped2 = re.sub(r'DO \$\$.*?END \$\$;', 'DO_BLOCK', content, flags=re.DOTALL)
    for m in re.finditer(r'ALTER TABLE \w+\s+ADD CONSTRAINT', stripped2):
        line_num = content[:m.start()].count('\n') + 1
        file_issues.append('  L%d: bare ALTER TABLE ADD CONSTRAINT' % line_num)

    # 5. CREATE TRIGGER without DROP TRIGGER IF EXISTS before it
    for m in re.finditer(r'^CREATE (?:CONSTRAINT )?TRIGGER (\w+)', content, re.MULTILINE):
        trig_name = m.group(1)
        line_num = content[:m.start()].count('\n') + 1
        start = max(0, m.start() - 400)
        context_before = content[start:m.start()]
        drop_key = 'DROP TRIGGER IF EXISTS ' + trig_name
        in_format = 'EXECUTE format' in context_before[-150:]
        if drop_key not in context_before and not in_format:
            file_issues.append('  L%d: CREATE TRIGGER %s - missing DROP IF EXISTS' % (line_num, trig_name))

    # 6. CREATE EXTENSION without IF NOT EXISTS
    for m in re.finditer(r'CREATE EXTENSION (?!IF NOT EXISTS)', content):
        line_num = content[:m.start()].count('\n') + 1
        file_issues.append('  L%d: bare CREATE EXTENSION' % line_num)

    if file_issues:
        issues.append('=== %s ===' % fname)
        issues.extend(file_issues)

if issues:
    print('PROBLEMS FOUND:')
    for line in issues:
        print(line)
else:
    print('ALL CLEAN - no idempotency issues found!')
