
exports.up = function(knex, Promise) {
   return knex.schema.createTable('users', function (table) {
        table.increments();
        table.string('firstName');
        table.string('lastName');
        table.string('email').unique();
        table.string('password').nullable();
        table.string('photo').nullable();
        table.enu('role',['seller','buyer']);
        table.string('provider').nullable();
        table.string('resetcode').nullable();
        table.string('confirmcode').nullable();
        table.string('confirmuser');
        table.string('socialId').nullable().unique();
        table.timestamps();
    })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('users');
};
