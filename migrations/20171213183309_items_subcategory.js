exports.up = function(knex, Promise) {
    return knex.schema.createTable('subcategory', function (table) {
        table.increments();
        table.string('subcategory_name').unique();
        table.integer('category_id').unsigned();
        table.foreign('category_id').references('category.id');
        table.timestamps();
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('subcategory');
};
