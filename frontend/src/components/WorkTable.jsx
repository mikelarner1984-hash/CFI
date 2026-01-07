import { useState, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

export const WorkTable = ({ entries, onEdit, onDelete, onToggleWorked }) => {
  const [columnFilters, setColumnFilters] = useState([]);
  const [sorting, setSorting] = useState([]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "date",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => format(new Date(row.getValue("date")), "MMM dd, yyyy"),
        filterFn: (row, id, value) => {
          return row.getValue(id)?.toLowerCase().includes(value.toLowerCase());
        },
      },
      {
        accessorKey: "client",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Client
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => row.getValue("client") || "-",
        filterFn: (row, id, value) => {
          return row.getValue(id)?.toLowerCase().includes(value.toLowerCase());
        },
      },
      {
        accessorKey: "startTime",
        header: "Start Time",
        cell: ({ row }) => row.getValue("startTime"),
      },
      {
        accessorKey: "finishTime",
        header: "Finish Time",
        cell: ({ row }) => row.getValue("finishTime"),
      },
      {
        accessorKey: "totalHours",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Total Hours
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const hours = parseFloat(row.getValue("totalHours"));
          return <div className="font-medium">{hours.toFixed(2)}</div>;
        },
      },
      {
        accessorKey: "clientMiles",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Client Miles
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const miles = parseFloat(row.getValue("clientMiles"));
          return <div>{miles.toFixed(1)}</div>;
        },
      },
      {
        accessorKey: "commuteMiles",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Commute Miles
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const miles = parseFloat(row.getValue("commuteMiles"));
          return <div>{miles.toFixed(1)}</div>;
        },
      },
      {
        accessorKey: "worked",
        header: "Worked",
        cell: ({ row }) => {
          const entry = row.original;
          return (
            <Switch
              checked={entry.worked !== undefined ? entry.worked : true}
              onCheckedChange={(checked) => onToggleWorked(entry.id, checked)}
            />
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const entry = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(entry)} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(entry.id)}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onEdit, onDelete, onToggleWorked]
  );

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      columnFilters,
      sorting,
    },
  });

  const totals = useMemo(() => {
    const filtered = table.getFilteredRowModel().rows.map(row => row.original);
    // Only sum entries where worked is true
    const workedEntries = filtered.filter(entry => entry.worked !== false);
    return workedEntries.reduce(
      (acc, entry) => ({
        totalHours: acc.totalHours + (entry.totalHours || 0),
        clientMiles: acc.clientMiles + (entry.clientMiles || 0),
        commuteMiles: acc.commuteMiles + (entry.commuteMiles || 0),
      }),
      { totalHours: 0, clientMiles: 0, commuteMiles: 0 }
    );
  }, [table.getFilteredRowModel().rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 px-6 pt-6">
        <Input
          placeholder="Filter by date..."
          value={(table.getColumn("date")?.getFilterValue()) ?? ""}
          onChange={(event) =>
            table.getColumn("date")?.setFilterValue(event.target.value)
          }
          className="max-w-xs"
        />
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No entries found. Add your first entry to get started.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {table.getRowModel().rows?.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-semibold">
                  Totals (Worked Days Only)
                </TableCell>
                <TableCell className="font-semibold">
                  {totals.totalHours.toFixed(2)}
                </TableCell>
                <TableCell className="font-semibold">
                  {totals.clientMiles.toFixed(1)}
                </TableCell>
                <TableCell className="font-semibold">
                  {totals.commuteMiles.toFixed(1)}
                </TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
};
