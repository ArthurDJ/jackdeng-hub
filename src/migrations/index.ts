import * as migration_20260404_175323_init from './20260404_175323_init';
import * as migration_20260404_175721_add_core_collections from './20260404_175721_add_core_collections';

export const migrations = [
  {
    up: migration_20260404_175323_init.up,
    down: migration_20260404_175323_init.down,
    name: '20260404_175323_init',
  },
  {
    up: migration_20260404_175721_add_core_collections.up,
    down: migration_20260404_175721_add_core_collections.down,
    name: '20260404_175721_add_core_collections'
  },
];
