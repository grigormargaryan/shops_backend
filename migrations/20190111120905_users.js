exports.up = function(knex, Promise) {
  return knex.schema.createTable('users', function (table) {
    table.increments();
    table.string('firstName').nullable();
    table.string('lastName').nullable();
    table.string('email').unique();
    table.string('password').nullable();
    table.enu('role',['user','admin']).defaultTo('user');
    table.string('confirmcode').nullable();
    table.string('profilePicURL').nullable().defaultTo('user.jpg');
    table.enu('confirmuser',['0','1']);
    table.string('socialId').nullable().unique();
    table.timestamps();
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('users');
};
