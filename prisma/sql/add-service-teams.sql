-- Adds the five new service teams alongside the existing
-- LIBRARIAN and WEBSITE_EDITOR. Safe to re-run.
--
-- Run in Railway -> Postgres -> Query.

INSERT INTO "service_teams" ("id", "name", "label", "description", "createdAt")
VALUES
  ('team_worship',       'WORSHIP',        'Worship',        'Leads the congregation in worship — singers, musicians and sound.', NOW()),
  ('team_prayer',        'PRAYER',         'Prayer',         'Leads and coordinates prayer for the fellowship.',                  NOW()),
  ('team_evangelism',    'EVANGELISM',     'Evangelism',     'Outreach, sharing the gospel and welcoming newcomers.',             NOW()),
  ('team_social_affair', 'SOCIAL_AFFAIRS', 'Social Affairs', 'Care, hospitality and practical support for members.',              NOW()),
  ('team_social_media',  'SOCIAL_MEDIA',   'Social Media',   'Manages the fellowship''s social media presence.',                  NOW())
ON CONFLICT ("name") DO UPDATE
  SET "label"       = EXCLUDED."label",
      "description" = EXCLUDED."description";
