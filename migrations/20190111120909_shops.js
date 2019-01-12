exports.up = function(knex, Promise) {
  return knex.schema.createTable('shops', function (table) {
    table.increments();
    table.string('shop_name').nullable();
    table.string('country').nullable();
    table.string('city').nullable();
    table.string('street').nullable();
    table.string('phone').nullable();
    table.string('description').nullable();
    table.string('contact_email').unique();
    table.integer('users_id').unsigned();
    table.foreign('users_id').references('users.id').onDelete('cascade') ;
    table.timestamps();
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('shops');
};
