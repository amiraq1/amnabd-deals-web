/*
# Add icon_url to deals table

Adds an optional icon_url text column to the `deals` table and populates official icons
for all 10 deals (SimpleIcons or Google Favicons).
*/

ALTER TABLE deals ADD COLUMN IF NOT EXISTS icon_url text;

UPDATE deals SET icon_url = 'https://cdn.simpleicons.org/qwen' WHERE slug = 'qwen-cloud';
UPDATE deals SET icon_url = 'https://www.google.com/s2/favicons?domain=you.com&sz=128' WHERE slug = 'you-com';
UPDATE deals SET icon_url = 'https://cdn.simpleicons.org/deepgram' WHERE slug = 'deepgram';
UPDATE deals SET icon_url = 'https://www.google.com/s2/favicons?domain=assemblyai.com&sz=128' WHERE slug = 'assemblyai';
UPDATE deals SET icon_url = 'https://cdn.simpleicons.org/githubcopilot/white' WHERE slug = 'github-copilot';
UPDATE deals SET icon_url = 'https://www.google.com/s2/favicons?domain=exa.ai&sz=128' WHERE slug = 'exa-ai';
UPDATE deals SET icon_url = 'https://cdn.simpleicons.org/figma' WHERE slug = 'figma';
UPDATE deals SET icon_url = 'https://www.google.com/s2/favicons?domain=generalcompute.com&sz=128' WHERE slug = 'general-compute';
UPDATE deals SET icon_url = 'https://www.google.com/s2/favicons?domain=tinyfish.ai&sz=128' WHERE slug = 'tinyfish';
UPDATE deals SET icon_url = 'https://cdn.simpleicons.org/zedindustries' WHERE slug = 'zed';
