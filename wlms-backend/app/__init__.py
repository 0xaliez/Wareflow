import os
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.utils.db import close_db

jwt = JWTManager()

def create_app():
    app = Flask(__name__)

    # JWT
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key')

    app.config['DB_HOST']     = os.environ.get('DB_HOST', 'localhost')
    app.config['DB_PORT']     = int(os.environ.get('DB_PORT', 5432))
    app.config['DB_NAME']     = os.environ.get('DB_NAME', 'wlms')
    app.config['DB_USER']     = os.environ.get('DB_USER', 'postgres')
    app.config['DB_PASSWORD'] = os.environ.get('DB_PASSWORD', 'temp')
    app.config['DB_SSLMODE'] = os.environ.get('DB_SSLMODE', 'disable')

    jwt.init_app(app)
    CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], "allow_headers": ["*"]}})

    app.teardown_appcontext(close_db)

    from app.routes.auth               import bp as auth_bp
    from app.routes.purchase_orders    import bp as po_bp
    from app.routes.goods_receipts     import bp as grn_bp
    from app.routes.sales_orders       import bp as so_bp
    from app.routes.delivery_challans  import bp as dc_bp
    from app.routes.inventory          import bp as inv_bp
    from app.routes.suppliers          import bp as sup_bp
    from app.routes.customers          import bp as cust_bp
    from app.routes.items              import bp as items_bp
    from app.routes.users              import bp as users_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(po_bp)
    app.register_blueprint(grn_bp)
    app.register_blueprint(so_bp)
    app.register_blueprint(dc_bp)
    app.register_blueprint(inv_bp)
    app.register_blueprint(sup_bp)
    app.register_blueprint(cust_bp)
    app.register_blueprint(items_bp)
    app.register_blueprint(users_bp)

    return app