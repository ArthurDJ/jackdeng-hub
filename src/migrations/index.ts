import * as migration_20260404_175323_init from './20260404_175323_init';
import * as migration_20260404_175721_add_core_collections from './20260404_175721_add_core_collections';
import * as migration_20260406_175247_v030_cats from './20260406_175247_v030_cats';
import * as migration_20260407_002218_add_comments from './20260407_002218_add_comments';

export const migrations = [
  {
    up: migration_20260404_175323_init.up,
    down: migration_20260404_175323_init.down,
    name: '20260404_175323_init',
  },
  {
    up: migration_20260404_175721_add_core_collections.up,
    down: migration_20260404_175721_add_core_collections.down,
    name: '20260404_175721_add_core_collections',
  },
  {
    up: migration_20260406_175247_v030_cats.up,
    down: migration_20260406_175247_v030_cats.down,
    name: '20260406_175247_v030_cats',
  },
  {
    up: migration_20260407_002218_add_comments.up,
    down: migration_20260407_002218_add_comments.down,
    name: '20260407_002218_add_comments',
  },
];
