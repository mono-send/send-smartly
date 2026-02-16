

## Sidebar User Menu with Popover

### What changes
Add a clickable chevron (up/down arrows) icon to the sidebar footer area next to the user info. Clicking it opens a popover menu with options like Settings, Upgrade plan, Learn more, and Log out.

### Visual reference
- The footer will show the user avatar, name, plan, and a `ChevronsUpDown` icon on the right
- Clicking the footer area opens a Popover above it with menu items grouped by separators

### Menu items (adapted for MonoSend)
- User email (displayed at top)
- Settings (links to /settings)
- Get help (external link or placeholder)
- Separator
- Upgrade plan (placeholder)
- Learn more (placeholder)
- Separator
- Log out (calls `logout()` from AuthContext)

### Technical details

**File: `src/components/layout/Sidebar.tsx`**
- Import `Popover`, `PopoverTrigger`, `PopoverContent` from `@/components/ui/popover`
- Import `ChevronsUpDown`, `Settings`, `HelpCircle`, `ArrowUpCircle`, `Info`, `LogOut` icons
- Import `useAuth` from `@/contexts/AuthContext`
- Import `useNavigate` from `react-router-dom`
- Replace the static footer `div` with a Popover component
- The trigger is the existing footer content plus a `ChevronsUpDown` icon on the right
- The popover content renders menu items as styled buttons/links with icons, separated by dividers
- Log out calls `logout()` and navigates to `/login`
- Settings navigates to `/settings`

No new files needed. Only `Sidebar.tsx` is modified.

