from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass


"""
  1. Table registry — Base keeps an internal catalog of all models that inherit from it. When you later run migrations or create_all(),  
  SQLAlchemy knows which tables to create because they're all registered under this one Base.
  2. Column mapping — inheriting from Base tells SQLAlchemy "this class represents a database table." It enables the magic where class
  attributes like Column(String) get mapped to actual SQL columns.

  Without a shared Base, SQLAlchemy wouldn't know your model classes are meant to be database tables. It's the glue between your Python  
  classes and your SQL schema.
"""