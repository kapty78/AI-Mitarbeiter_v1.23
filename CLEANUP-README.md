# Projektbereinigung

Dieses Dokument beschreibt die Bereinigung des Projekts, die am 02.04.2024 durchgeführt wurde.

## Übersicht der Änderungen

1. Alle alten SQL-Migrationsdateien wurden nach `backup-sql/` verschoben
2. Alte JavaScript-Skripte wurden nach `backup-scripts/` verschoben
3. Die `sql/`-Verzeichnisstruktur wurde auf die aktuell verwendeten Dateien reduziert
4. Die `package.json` wurde aktualisiert, um veraltete Skripte zu entfernen

## Aktuelle Datenbankstruktur

Die aktuelle Datenbankstruktur wird durch die folgenden Dateien definiert:

- `sql/tasks_schema.sql` - Definiert die Aufgaben-Tabelle und zugehörige Funktionen
- `sql/create_company_admin_function.sql` - Definiert die Funktion zur Erstellung von Unternehmensadministratoren

## Verwendete Tabellen im Projekt

Die folgenden Tabellen werden aktiv im Projekt verwendet:

1. `tasks` - Speichert Aufgaben mit Eigenschaften wie Wiederholung, Priorität, etc.
2. `chat_sessions` - Speichert Chat-Sitzungen
3. `chat_messages` - Speichert Nachrichten in Chat-Sitzungen
4. `workspaces` - Speichert Arbeitsbereiche für Benutzer
5. `companies` - Speichert Unternehmensinformationen
6. `profiles` - Speichert Benutzerprofile

## Wichtige Dateien und Verzeichnisse

- `/app` - Enthält alle Anwendungsrouten und Komponenten
- `/lib` - Enthält Hilfsfunktionen und Dienste
- `/components` - Enthält wiederverwendbare React-Komponenten
- `/types` - Enthält Typendefinitionen
- `/sql` - Enthält aktuelle SQL-Schemas

## Sicherungen

Alle entfernten Dateien wurden in Backup-Verzeichnissen gesichert:

- `backup-sql/` - Enthält alle alten SQL-Dateien
- `backup-scripts/` - Enthält alte JavaScript-Skripte
- `sql-backup/` - Enthält eine Sicherung des SQL-Verzeichnisses vor der Bereinigung

Diese Sicherungen können gelöscht werden, wenn sichergestellt ist, dass die Anwendung ordnungsgemäß funktioniert.

## Anweisungen zum Löschen der Sicherungen

Wenn die Anwendung nach der Bereinigung ordnungsgemäß funktioniert, können die Sicherungsverzeichnisse gelöscht werden:

```bash
rm -rf backup-sql backup-scripts sql-backup
```

## Anweisungen zur Wiederherstellung

Sollten nach der Bereinigung Probleme auftreten, können die Originaldateien aus den Sicherungsverzeichnissen wiederhergestellt werden. 