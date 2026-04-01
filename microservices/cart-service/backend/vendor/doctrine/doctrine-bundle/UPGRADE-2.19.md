UPGRADE FROM 2.18 to 2.19
=========================

Configuration
-------------

### Proxy-related configuration settings are conditionally deprecated

When using PHP 8.4 or higher in combination with Doctrine ORM 3.4 or
higher, the following configuration settings are deprecated:

- `auto_generate_proxy_classes`
- `proxy_namespace`
- `proxy_dir`

Instead, they should be unset, and `enable_native_lazy_objects` should
be set to `true`.
