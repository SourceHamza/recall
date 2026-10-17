-- Optional: fills the first account with demo data so you can compare against the design.
-- Sign up in the app first, then run this in the SQL Editor.
do $$
declare
  uid uuid := (select id from auth.users order by created_at limit 1);
  school uuid;
  t_green uuid; t_teal uuid; t_orange uuid;
  b uuid;
begin
  insert into projects (user_id, name, is_pinned) values
    (uid, 'UI design', true), (uid, 'Design Engineer', true),
    (uid, 'Valorant', true), (uid, 'History', true);
  insert into projects (user_id, name) values (uid, 'School') returning id into school;

  insert into tags (user_id, name, color) values (uid, 'poster', 'green') returning id into t_green;
  insert into tags (user_id, name, color) values (uid, 'framer', 'teal') returning id into t_teal;
  insert into tags (user_id, name, color) values (uid, 'inspo', 'orange') returning id into t_orange;

  insert into bits (user_id, project_id, type, title, description, url) values
    (uid, school, 'post', 'Soul Defect', 'small Poster about how the soul is a defect', 'https://example.com/soul-defect')
    returning id into b;
  insert into bit_tags values (b, t_green), (b, t_teal), (b, t_orange);

  insert into bits (user_id, project_id, type, title, description, url) values
    (uid, school, 'post', 'Ercan post about Framer', 'Framer agent interaction', 'https://example.com/ercan')
    returning id into b;
  insert into bit_tags values (b, t_teal), (b, t_orange);

  insert into bits (user_id, project_id, type, title, description, url) values
    (uid, school, 'bookmark', 'Soul Reflect', 'small Poster about how the soul is a reflection.', 'https://example.com/soul-reflect')
    returning id into b;
  insert into bit_tags values (b, t_green), (b, t_orange);
end $$;
