exports.up = function(knex, Promise) {
    return knex.schema.createTable('items', function (table) {
        table.increments();
        table.integer('user_id').unsigned();
        table.integer('category_id').unsigned();
        table.foreign('user_id').references('users.id');
        table.foreign('category_id').references('category.id');
        table.timestamps();
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('items');
};
