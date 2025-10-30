"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const TimesheetDisplaySkeleton = () => {
  return (
    <Card className="w-full max-w-4xl mx-auto mt-8 shadow-sm">
      <CardHeader>
        <CardTitle className="text-center text-2xl">
          <Skeleton className="h-8 w-1/2 mx-auto" />
        </CardTitle>
        <CardDescription className="text-center text-lg">
          <Skeleton className="h-6 w-1/3 mx-auto mt-2" />
        </CardDescription>
        <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
          <div>
            <p><Skeleton className="h-4 w-3/4 mb-1" /></p>
            <p><Skeleton className="h-4 w-2/3 mb-1" /></p>
            <p><Skeleton className="h-4 w-4/5 mb-1" /></p>
            <p><Skeleton className="h-4 w-1/2 mb-1" /></p>
            <p><Skeleton className="h-4 w-2/3 mb-1" /></p>
          </div>
          <div className="text-right">
            <p><Skeleton className="h-4 w-3/4 ml-auto mb-1" /></p>
            <p><Skeleton className="h-4 w-2/3 ml-auto mb-1" /></p>
            <p><Skeleton className="h-4 w-4/5 ml-auto mb-1" /></p>
            <p><Skeleton className="h-4 w-1/2 ml-auto mb-1" /></p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]"><Skeleton className="h-4 w-[50px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[70px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[70px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[70px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[70px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[70px]" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-4 w-[80px] ml-auto" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }).map((_, i) => ( // Exibe 10 linhas de skeleton
                <TableRow key={i}>
                  <TableCell className="font-medium"><Skeleton className="h-4 w-[30px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-[50px] ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[90px]" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimesheetDisplaySkeleton;