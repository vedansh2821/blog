'use client';

import React from 'react';
import Link from 'next/link';
import { Home, BookOpen, Hash, Star, Gamepad2, PlusCircle, Calendar, Archive, Pin } from 'lucide-react'; // Added Calendar, Archive, Pin
import {
  Sidebar as ShadSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea
import { useAuth } from '@/lib/auth/authContext'; // Import useAuth
import { cn } from '@/lib/utils';

const categories = [
  { name: 'Technology', slug: 'Technology', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-laptop"><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55A1 1 0 0 1 20.7 20H3.3a1 1 0 0 1-.58-1.45L4 16"/></svg> },
  { name: 'Lifestyle', slug: 'Lifestyle', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> },
  { name: 'Health', slug: 'Health', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  { name: 'Travel', slug: 'Travel', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plane"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.7 3.7c.5.5 1.3.3 1.8-.2l.5-.3c.4-.3.6-.7.5-1.2z"/></svg> },
  { name: 'Love', slug: 'Love', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> },
  { name: 'Others', slug: 'Others', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg> }, // Added Others category
];

const popularPosts = [
  { title: 'Mastering TypeScript', slug: 'mastering-typescript-for-modern-web-development' },
  { title: 'Sustainable Living', slug: 'sustainable-living-simple-steps-for-a-greener-life' },
  { title: 'Mindfulness Meditation', slug: 'mindfulness-meditation-a-beginners-guide' },
];

// Mock archives data
const archives = [
    { month: 'July 2024', slug: '2024-07' },
    { month: 'June 2024', slug: '2024-06' },
    { month: 'May 2024', slug: '2024-05' },
];

export default function Sidebar() {
  const { setOpenMobile } = useSidebar();
  const { currentUser } = useAuth();
  const { state } = useSidebar(); // Get sidebar state

  return (
    <ShadSidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarContent className="p-0 pt-16 flex flex-col"> {/* Ensure flex-col for scroll area */}
        <ScrollArea className="flex-grow"> {/* Wrap content in ScrollArea */}
          <SidebarMenu className="p-2">
            <SidebarMenuItem>
                <Link href="/" passHref legacyBehavior>
                   <SidebarMenuButton tooltip="Home" onClick={() => setOpenMobile(false)}>
                     <Home />
                     <span>Home</span>
                   </SidebarMenuButton>
                 </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <Link href="/blogs" passHref legacyBehavior>
                   <SidebarMenuButton tooltip="All Blogs" onClick={() => setOpenMobile(false)}>
                     <BookOpen />
                     <span>Blogs</span>
                   </SidebarMenuButton>
                 </Link>
            </SidebarMenuItem>
             {currentUser && (
                <SidebarMenuItem>
                   <Link href="/admin/create-post" passHref legacyBehavior>
                      <SidebarMenuButton tooltip="Create Post" onClick={() => setOpenMobile(false)}>
                          <PlusCircle />
                          <span>Create Post</span>
                      </SidebarMenuButton>
                   </Link>
                </SidebarMenuItem>
             )}
          </SidebarMenu>

          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <Hash />
              <span>Categories</span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {categories.map((category) => (
                  <SidebarMenuItem key={category.slug}>
                     <Link href={`/blogs?category=${category.slug}`} passHref legacyBehavior>
                        <SidebarMenuButton size="sm" tooltip={category.name} onClick={() => setOpenMobile(false)}>
                          {category.icon}
                          <span>{category.name}</span>
                        </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <Star />
              <span>Popular Posts</span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {popularPosts.map((post) => (
                  <SidebarMenuItem key={post.slug}>
                    <Link href={`/blogs/${post.slug}`} passHref legacyBehavior>
                        <SidebarMenuButton size="sm" tooltip={post.title} onClick={() => setOpenMobile(false)}>
                          <Pin className="h-3 w-3 mr-1 text-muted-foreground" /> {/* Added Pin icon */}
                          <span>{post.title}</span>
                        </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

           {/* Archives Section */}
           <SidebarGroup>
             <SidebarGroupLabel className="flex items-center gap-2">
               <Archive />
               <span>Archives</span>
             </SidebarGroupLabel>
             <SidebarGroupContent>
               <SidebarMenu>
                 {archives.map((archive) => (
                   <SidebarMenuItem key={archive.slug}>
                      {/* TODO: Update href to actual archive page/filter */}
                      <Link href={`/blogs?archive=${archive.slug}`} passHref legacyBehavior>
                         <SidebarMenuButton size="sm" tooltip={archive.month} onClick={() => setOpenMobile(false)}>
                            <Calendar className="h-3 w-3 mr-1 text-muted-foreground"/>
                           <span>{archive.month}</span>
                         </SidebarMenuButton>
                     </Link>
                   </SidebarMenuItem>
                 ))}
               </SidebarMenu>
             </SidebarGroupContent>
           </SidebarGroup>

           <SidebarSeparator />

          <SidebarMenu className="p-2">
            <SidebarMenuItem>
                <Link href="/fun" passHref legacyBehavior>
                   <SidebarMenuButton tooltip="Fun Tab" onClick={() => setOpenMobile(false)}>
                      <Gamepad2 />
                      <span>Fun Tab</span>
                   </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
          </SidebarMenu>

        </ScrollArea> {/* End ScrollArea */}
      </SidebarContent>
      {/* Optionally add a sticky footer inside the sidebar if needed */}
       {/* <SidebarFooter className="p-2 sticky bottom-0 bg-sidebar border-t border-sidebar-border"> */}
          {/* Footer content */}
       {/* </SidebarFooter> */}
    </ShadSidebar>
  );
}

