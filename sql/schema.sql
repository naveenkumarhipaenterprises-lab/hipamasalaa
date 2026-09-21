-- ==============================================================================
-- HIPA MASALA D2C E-COMMERCE PRODUCTION SQL SCHEMA (SUPABASE POSTGRESQL)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. PRODUCTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    pack_size TEXT NOT NULL,
    image TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('masalas', 'spices')),
    stock_status TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'out_of_stock', 'pre_order')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. WISHLIST ITEMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    product_slug TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_product_slug UNIQUE (user_id, product_slug)
);

-- ------------------------------------------------------------------------------
-- 4. ORDERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    shipping NUMERIC(10, 2) DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL,
    shipping_address JSONB,
    payment_method TEXT DEFAULT 'cod',
    payment_status TEXT DEFAULT 'unpaid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. ORDER ITEMS TABLE (Historical snapshot)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    pack_size TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 6. AUTOMATED TIMESTAMP & PROFILE TRIGGERS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger updated_at on profiles
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger updated_at on orders
DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Automatically create profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Products: Everyone (including guests) can read products
DROP POLICY IF EXISTS "Products are publicly readable" ON public.products;
CREATE POLICY "Products are publicly readable"
    ON public.products FOR SELECT
    TO public
    USING (true);

-- Profiles: Users can view and edit only their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Wishlist Items: Users can view, insert, and delete only their own wishlist items
DROP POLICY IF EXISTS "Users can read own wishlist" ON public.wishlist_items;
CREATE POLICY "Users can read own wishlist"
    ON public.wishlist_items FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add to own wishlist" ON public.wishlist_items;
CREATE POLICY "Users can add to own wishlist"
    ON public.wishlist_items FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete from own wishlist" ON public.wishlist_items;
CREATE POLICY "Users can delete from own wishlist"
    ON public.wishlist_items FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Orders: Users can read and create their own orders
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
CREATE POLICY "Users can read own orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Order Items: Users can read items of their own orders
DROP POLICY IF EXISTS "Users can read items of own orders" ON public.order_items;
CREATE POLICY "Users can read items of own orders"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert items for own orders" ON public.order_items;
CREATE POLICY "Users can insert items for own orders"
    ON public.order_items FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 8. INITIAL PRODUCT SEEDING (8 Core Products)
-- ------------------------------------------------------------------------------
INSERT INTO public.products (name, slug, description, price, pack_size, image, category, stock_status)
VALUES
    ('Sambar Powder', 'sambar-powder', 'Authentic South Indian Sambar Powder prepared from roasted coriander, toor dal, and red chillies.', 95.00, '200g', 'assets/images/products/sambar-powder.png', 'masalas', 'in_stock'),
    ('Rasam Powder', 'rasam-powder', 'Traditional tangy and pepper-forward Rasam Powder with roasted cumin, coriander, and native spices.', 90.00, '200g', 'assets/images/products/rasam-powder.png', 'masalas', 'in_stock'),
    ('Garam Masala', 'garam-masala', 'Royal aromatic spice blend made from stone-ground whole spices with zero fillers or artificial flavours.', 120.00, '100g', 'assets/images/products/garam-masala.png', 'masalas', 'in_stock'),
    ('Turmeric Powder', 'turmeric-powder', 'High-curcumin pure turmeric root powder, naturally golden, sun-dried, and unadulterated.', 75.00, '200g', 'assets/images/products/turmeric-powder.png', 'spices', 'in_stock'),
    ('Red Chilli Powder', 'red-chilli-powder', 'Vibrant stemless Guntur red chilli powder delivering natural pungency and deep red colour.', 85.00, '200g', 'assets/images/products/red-chilli-powder.png', 'spices', 'in_stock'),
    ('Coriander Powder', 'coriander-powder', 'Cold-ground whole coriander seeds retaining essential aromatic oils and refreshing herbal citrus notes.', 80.00, '200g', 'assets/images/products/coriander-powder.png', 'spices', 'in_stock'),
    ('Cumin Powder', 'cumin-powder', 'Fragrant roasted cumin seed powder ground fresh to elevate everyday tadkas and curries.', 110.00, '100g', 'assets/images/products/cumin-powder.png', 'spices', 'in_stock'),
    ('Black Pepper Powder', 'pepper-powder', 'Bold Malabar black pepper powder coarsely ground for sharp warmth and intense aroma.', 130.00, '100g', 'assets/images/products/pepper-powder.png', 'spices', 'in_stock')
ON CONFLICT (slug) DO NOTHING;
