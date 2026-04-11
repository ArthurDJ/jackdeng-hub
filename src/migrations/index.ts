import * as migration_20260404_175323_init from './20260404_175323_init';
import * as migration_20260404_175721_add_core_collections from './20260404_175721_add_core_collections';
import * as migration_20260406_175247_v030_cats from './20260406_175247_v030_cats';
import * as migration_20260407_002218_add_comments from './20260407_002218_add_comments';
import * as migration_20260408_003804 from './20260408_003804';
import * as migration_20260408_215850 from './20260408_215850';
import * as migration_20260408_233949 from './20260408_233949';
import * as migration_20260409_204519_add_mfa_fields from './20260409_204519_add_mfa_fields';
import * as migration_20260410_004448 from './20260410_004448';
import * as migration_20260410_021800 from './20260410_021800';
import * as migration_20260411_000001_add_tool_runs_rels from './20260411_000001_add_tool_runs_rels';

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
  {
    up: migration_20260408_003804.up,
    down: migration_20260408_003804.down,
    name: '20260408_003804',
  },
  {
    up: migration_20260408_215850.up,
    down: migration_20260408_215850.down,
    name: '20260408_215850',
  },
  {
    up: migration_20260408_233949.up,
    down: migration_20260408_233949.down,
    name: '20260408_233949',
  },
  {
    up: migration_20260409_204519_add_mfa_fields.up,
    down: migration_20260409_204519_add_mfa_fields.down,
    name: '20260409_204519_add_mfa_fields',
  },
  {
    up: migration_20260410_004448.up,
    down: migration_20260410_004448.down,
    name: '20260410_004448',
  },
  {
    up: migration_20260410_021800.up,
    down: migration_20260410_021800.down,
    name: '20260410_021800',
  },
  {
    up: migration_20260411_000001_add_tool_runs_rels.up,
    down: migration_20260411_000001_add_tool_runs_rels.down,
    name: '20260411_000001_add_tool_runs_rels',
  },
];
