'use strict';
const list = [require('./thulla'), require('./bluff'), require('./jackthief')];
const map = new Map(list.map(g => [g.id, g]));

module.exports = {
  get: id => map.get(id),
  all: () => list,
  catalog: () => list.map(g => ({ id: g.id, name: g.name, min: g.min, max: g.max, settings: g.settings })),
};
