'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, LineChart, PieChart, MessageSquare } from 'lucide-react'; // Example icons, Added MessageSquare
import { ChartTooltip, ChartTooltipContent, ChartContainer } from "@/components/ui/chart"
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from "recharts"

// Mock data fetching function for analytics
const fetchAnalyticsData = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

    return {
        totalViews: Math.floor(Math.random() * 10000) + 5000,
        uniqueVisitors: Math.floor(Math.random() * 5000) + 1000,
        postsPublished: Math.floor(Math.random() * 50) + 10,
        totalComments: Math.floor(Math.random() * 500) + 100,
        viewsOverTime: [
            { date: 'Jan', views: Math.floor(Math.random() * 500) + 100 },
            { date: 'Feb', views: Math.floor(Math.random() * 500) + 200 },
            { date: 'Mar', views: Math.floor(Math.random() * 500) + 300 },
            { date: 'Apr', views: Math.floor(Math.random() * 500) + 400 },
            { date: 'May', views: Math.floor(Math.random() * 500) + 500 },
            { date: 'Jun', views: Math.floor(Math.random() * 500) + 600 },
        ],
        topPosts: [
            { title: 'The Future of AI', views: Math.floor(Math.random() * 1000) + 500, slug: 'future-of-ai' },
            { title: 'Minimalist Living Guide', views: Math.floor(Math.random() * 800) + 400, slug: 'minimalist-living' },
            { title: '10 Healthy Habits', views: Math.floor(Math.random() * 700) + 300, slug: 'healthy-habits' },
        ],
        categoryDistribution: [
            { name: 'Technology', value: Math.floor(Math.random() * 500) + 100 },
            { name: 'Lifestyle', value: Math.floor(Math.random() * 400) + 100 },
            { name: 'Health', value: Math.floor(Math.random() * 300) + 100 },
            { name: 'Travel', value: Math.floor(Math.random() * 200) + 50 },
        ],
    };
};

const chartConfigViews = {
  views: {
    label: "Views",
    color: "hsl(var(--chart-1))",
  },
}

const chartConfigCategories = {
  value: {
     label: "Views",
  },
   technology: { label: "Technology", color: "hsl(var(--chart-1))" },
   lifestyle: { label: "Lifestyle", color: "hsl(var(--chart-2))" },
   health: { label: "Health", color: "hsl(var(--chart-3))" },
   travel: { label: "Travel", color: "hsl(var(--chart-4))" },
 }

export default function AdminDashboardPage() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetchAnalyticsData()
            .then(data => setAnalytics(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto py-8">
                <Skeleton className="h-8 w-48 mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-5 w-24 mb-2" />
                                <Skeleton className="h-8 w-16" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <Card>
                        <CardHeader> <Skeleton className="h-6 w-40" /> </CardHeader>
                        <CardContent> <Skeleton className="h-64 w-full" /> </CardContent>
                     </Card>
                     <Card>
                        <CardHeader> <Skeleton className="h-6 w-40" /> </CardHeader>
                         <CardContent> <Skeleton className="h-64 w-full" /> </CardContent>
                    </Card>
                     <Card className="lg:col-span-2">
                         <CardHeader> <Skeleton className="h-6 w-32" /> </CardHeader>
                         <CardContent>
                            <Skeleton className="h-10 w-full mb-2" />
                            <Skeleton className="h-10 w-full mb-2" />
                             <Skeleton className="h-10 w-full" />
                         </CardContent>
                     </Card>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return <div className="container mx-auto py-8 text-center">Failed to load analytics data.</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

             {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </CardHeader>
                   <CardContent>
                        <div className="text-2xl font-bold">{analytics.uniqueVisitors.toLocaleString()}</div>
                       <p className="text-xs text-muted-foreground">+15.3% from last month</p>
                   </CardContent>
               </Card>
                <Card>
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Posts Published</CardTitle>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h4v11zM18 22V4H8"/></svg>
                   </CardHeader>
                   <CardContent>
                        <div className="text-2xl font-bold">{analytics.postsPublished}</div>
                       <p className="text-xs text-muted-foreground">+5 this month</p>
                   </CardContent>
               </Card>
                <Card>
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                       <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                   <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalComments.toLocaleString()}</div>
                       <p className="text-xs text-muted-foreground">+50 this month</p>
                   </CardContent>
               </Card>
            </div>

             {/* Charts */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                   <CardHeader>
                        <CardTitle>Views Over Time</CardTitle>
                         <CardDescription>Monthly page views trend.</CardDescription>
                     </CardHeader>
                   <CardContent>
                       <ChartContainer config={chartConfigViews} className="h-[300px] w-full">
                            <RechartsLineChart data={analytics.viewsOverTime} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Line type="monotone" dataKey="views" stroke="var(--color-views)" strokeWidth={2} dot={false} />
                            </RechartsLineChart>
                       </ChartContainer>
                     </CardContent>
                 </Card>
                <Card>
                   <CardHeader>
                        <CardTitle>Category Distribution</CardTitle>
                         <CardDescription>Views distribution by category.</CardDescription>
                     </CardHeader>
                   <CardContent className="flex items-center justify-center">
                        <ChartContainer config={chartConfigCategories} className="h-[300px] w-full">
                            <RechartsPieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                <Pie data={analytics.categoryDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="var(--color-categories)" label />
                           </RechartsPieChart>
                        </ChartContainer>
                     </CardContent>
                 </Card>
             </div>

            {/* Top Posts Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Performing Posts</CardTitle>
                    <CardDescription>Posts with the most views recently.</CardDescription>
                </CardHeader>
                <CardContent>
                     {/* Use ShadCN Table component here */}
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                           <thead className="bg-muted/50">
                                <tr>
                                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Views</th>
                                   <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                                </tr>
                           </thead>
                            <tbody className="divide-y divide-border">
                                {analytics.topPosts.map((post: any) => (
                                    <tr key={post.slug}>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{post.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{post.views.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <a href={`/blogs/${post.slug}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Post</a>
                                        </td>
                                    </tr>
                                ))}
                           </tbody>
                       </table>
                     </div>
                 </CardContent>
             </Card>
        </div>
    );
}
