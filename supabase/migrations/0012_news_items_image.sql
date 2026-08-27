-- Finnhub trae una imagen por noticia; la guardamos para poder mostrar la
-- nota principal en grande (estilo portada) en el feed de noticias.
alter table news_items add column if not exists image_url text;
