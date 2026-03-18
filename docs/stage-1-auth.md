# Stage 1 Auth Notes

## Login Flow

- User submits credentials on `/login`
- Auth.js `Credentials` provider validates the payload with Zod
- Prisma loads the matching user by email
- bcrypt verifies the password hash
- JWT session stores `id`, `name`, `email`, and `role`

## Protected Admin Access

- `/admin` uses a shared `requireAdminUser` server utility
- Unauthenticated visitors are redirected to `/login`
- Authenticated users without admin roles are redirected to `/admin/unauthorized`

## Seed Users

- `admin@trainovations.com`
- `manager@trainovations.com`
- `jay.jones@trainovations.com`
- `casey.rivera@trainovations.com`

Seed password for all MVP users:

- `Trainovations123!`
