
/**
  Users Model
  
  Provides a database-agnostic persistence layer to your application.
  
  Multiple relationships can be established in the model. These are set
  assigning properties to the model instance, that have a specific meaning.
  
  Relationships can be set as:
  
  this.hasOne = 'company';
  this.hasMany = ['friends(users)', 'groups'];
  this.belongsTo = ['company.boss', 'organization.founder'];
  this.belongsToMany = ['company.employees', 'organization.members'];

  The framework will link everything for you, providing extra methods to the
  objects generated by this model, which allow you to work with the relationships.
  
 */
  

function UsersModel(app) {
  
  this.driver = 'default';
  
  this.properties = {
    user    : {type: 'string', required: true, validates: 'alnum_underscores'},
    pass    : {type: 'string', required: true, validates: 'password'}
  }

}

module.exports = UsersModel;