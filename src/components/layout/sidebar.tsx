
'use client';

import React from 'react';
import Link from 'next/link';
import { Home, BookOpen, Hash, Star, Gamepad2, Target, Square } from 'lucide-react'; // Added Gamepad2, Target, Square
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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const categories = [
  { name: 'Technology', slug: 'technology', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-laptop"><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55A1 1 0 0 1 20.7 20H3.3a1 1 0 0 1-.58-1.45L4 16"/></svg> },
  { name: 'Lifestyle', slug: 'lifestyle', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> },
  { name: 'Health', slug: 'health', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  { name: 'Travel', slug: 'travel', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plane"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.7 3.7c.5.5 1.3.3 1.8-.2l.5-.3c.4-.3.6-.7.5-1.2z"/></svg> },
];

const popularPosts = [
  { title: 'The Future of AI', slug: 'future-of-ai' },
  { title: 'Minimalist Living Guide', slug: 'minimalist-living' },
  { title: '10 Healthy Habits', slug: 'healthy-habits' },
];

const funGames = [
    { name: 'Balloon Buster', slug: 'balloon-buster', icon: <Target /> },
    { name: 'Platformer Fun', slug: 'platformer-fun', icon: <Square /> },
     // Add more placeholder games here
];

export default function Sidebar() {
  return (
    <ShadSidebar side="left" variant="sidebar" collapsible="offcanvas">
      <SidebarContent className="p-0 pt-10"> {/* Increased top padding */}
         <SidebarMenu className="p-2">
            <SidebarMenuItem>
              <SidebarMenuButton href="/" tooltip="Home">
                <Home />
                <span>Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <SidebarMenuButton href="/blogs" tooltip="All Blogs">
                 <BookOpen />
                 <span>Blogs</span>
               </SidebarMenuButton>
            </SidebarMenuItem>
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
                  <SidebarMenuButton href={`/blogs/category/${category.slug}`} size="sm" tooltip={category.name}>
                    {category.icon}
                    <span>{category.name}</span>
                  </SidebarMenuButton>
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
                  <SidebarMenuButton href={`/blogs/${post.slug}`} size="sm" tooltip={post.title}>
                    <span>{post.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Fun Tab Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Gamepad2 />
            <span>Fun Tab</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {funGames.map((game) => (
                <SidebarMenuItem key={game.slug}>
                  {/* Using # as href for now, replace with actual routes when games are built */}
                  <SidebarMenuButton href="#" size="sm" tooltip={game.name}>
                     {game.icon}
                    <span>{game.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter className="p-2">
        {/* Footer content if needed */}
      </SidebarFooter>
    </ShadSidebar>
  );
}
