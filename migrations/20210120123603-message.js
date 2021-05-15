'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('message', {
      id : {
        primaryKey: true,
        type: Sequelize.UUID
      },
      message_type : {
        allowNull: false,
        type: Sequelize.STRING
      },
      message_name : {
        type: Sequelize.STRING
      },
      channel : {
        type: Sequelize.STRING
      },
      payload: {
        type: Sequelize.JSON
      },
      transaction_id : { 
        unique : true,
        type: Sequelize.STRING
      },
      is_success : {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      response: {
        type: Sequelize.JSON
      },
      created_at: {
        type: Sequelize.DATE
      },
      updated_at: {
        type: Sequelize.DATE
      },
      deleted_at: {
        type: Sequelize.DATE
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at'
    });
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.dropTable('message')
  }
};
