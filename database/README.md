# Database setup

Run the schema from the project root:

```bash
mysql -u root -p < database/schema.sql
```

The script recreates all Connectly tables. Do not run it against a database containing data you need to keep.
