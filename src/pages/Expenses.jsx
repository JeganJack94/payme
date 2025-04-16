import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Fab, Card, CardContent, Typography, Grid, Container, TextField,
  Select, MenuItem, IconButton, Box, FormControl, InputLabel,
  Stack, Chip, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListIcon from '@mui/icons-material/FilterList';
import { collection, query, getDocs, deleteDoc, doc, where } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

const Expenses = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [loading, setLoading] = useState(true);
  const [dateFilterType, setDateFilterType] = useState("thisYear");

  useEffect(() => {
    setInitialDateRange();
    if (auth.currentUser) {
      fetchExpenses();
    }
  }, [auth.currentUser]);

  const setInitialDateRange = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    const endOfYear = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
    setDateRange({ start: startOfYear, end: endOfYear });
  };

  const handleDateFilterChange = (type) => {
    const now = new Date();
    let start, end;

    if (type === "custom") {
      setDateFilterType(type);
      return; // Don't set date range for custom, let user pick dates
    }

    switch (type) {
      case "thisMonth":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "lastMonth":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "thisYear":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case "lastYear":
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        return;
    }
    
    setDateFilterType(type);
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  };

  const fetchExpenses = async () => {
    try {
      if (!auth.currentUser) {
        setExpenses([]);
        return;
      }
      const expensesRef = collection(db, `users/${auth.currentUser.uid}/expenses`);
      const querySnapshot = await getDocs(query(expensesRef));
      
      const expensesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setExpenses(expensesData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      if (!auth.currentUser) {
        console.error("No authenticated user!");
        return;
      }
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/expenses/${id}`));
      await fetchExpenses(); // Refresh the expenses list after deletion
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const handleEdit = (id) => {
    navigate(`/expense-form/${id}`);
  };

  const getFilteredExpenses = () => {
    if (!expenses || expenses.length === 0) {
      return [];
    }
    
    let filtered = [...expenses];
    
    try {
      // Search filter
      if (search) {
        filtered = filtered.filter((expense) =>
          expense.description?.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Date range filter
      if (dateRange.start && dateRange.end) {
        filtered = filtered.filter(
          (expense) =>
            expense.date >= dateRange.start && expense.date <= dateRange.end
        );
      }

      // Sort filter
      switch (filter) {
        case "recent":
          filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
          break;
        case "oldest":
          filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
          break;
        case "highest":
          filtered.sort((a, b) => b.amount - a.amount);
          break;
        case "lowest":
          filtered.sort((a, b) => a.amount - b.amount);
          break;
        default:
          break;
      }

      return filtered;
    } catch (error) {
      console.error("Error filtering expenses:", error);
      return [];
    }
  };

  const NoExpensesMessage = () => (
    <TableRow>
      <TableCell colSpan={6} align="center">
        <Typography variant="body1" sx={{ py: 2 }}>
          No expenses found
        </Typography>
      </TableCell>
    </TableRow>
  );

  if (loading) return <div>Loading expenses...</div>;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
        Expenses
      </Typography>

      <Stack spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 2, sm: 4 } }}>
        <Grid container spacing={{ xs: 1, sm: 2 }} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              size="small"
              fullWidth
              variant="outlined"
              placeholder="Search expenses"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel><FilterListIcon sx={{ mr: 1 }} />Sort</InputLabel>
              <Select
                value={filter}
                label={<><FilterListIcon /> Sort</>}
                onChange={(e) => setFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="recent">Most Recent</MenuItem>
                <MenuItem value="oldest">Oldest</MenuItem>
                <MenuItem value="highest">Highest Amount</MenuItem>
                <MenuItem value="lowest">Lowest Amount</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Stack 
              direction="row" 
              spacing={1} 
              sx={{ 
                flexWrap: 'wrap', 
                gap: 1,
                '& .MuiChip-root': { mb: { xs: 1, sm: 0 } }
              }}
            >
              <Chip
                label="This Month"
                onClick={() => handleDateFilterChange("thisMonth")}
                color={dateFilterType === "thisMonth" ? "primary" : "default"}
              />
              <Chip
                label="Last Month"
                onClick={() => handleDateFilterChange("lastMonth")}
                color={dateFilterType === "lastMonth" ? "primary" : "default"}
              />
              <Chip
                label="This Year"
                onClick={() => handleDateFilterChange("thisYear")}
                color={dateFilterType === "thisYear" ? "primary" : "default"}
              />
              <Chip
                label="Custom"
                onClick={() => handleDateFilterChange("custom")}
                color={dateFilterType === "custom" ? "primary" : "default"}
              />
            </Stack>
          </Grid>
        </Grid>

        {dateFilterType === "custom" && (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                type="date"
                fullWidth
                label="Start Date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                type="date"
                fullWidth
                label="End Date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        )}
      </Stack>

      <Box sx={{ overflowX: 'auto', width: '100%', mb: 2 }}>
        <TableContainer 
          component={Paper} 
          sx={{ 
            boxShadow: { xs: 0, sm: 1 },
            border: { xs: 1, sm: 0 },
            borderColor: 'divider'
          }}
        >
          <Table 
            sx={{ 
              minWidth: { xs: '100%', sm: 650 },
              '& .MuiTableCell-root': {
                px: { xs: 1, sm: 2 },
                py: { xs: 1, sm: 1.5 },
                '&:first-of-type': { pl: { xs: 2, sm: 2 } },
                '&:last-of-type': { pr: { xs: 2, sm: 2 } }
              }
            }} 
            aria-label="expenses table"
          >
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>S.No</TableCell>
                <TableCell>Description</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Category</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredExpenses().length > 0 ? (
                getFilteredExpenses().map((expense, index) => (
                  <TableRow key={expense.id}>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{index + 1}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" noWrap>{expense.description}</Typography>
                        <Typography 
                          variant="caption" 
                          color="textSecondary"
                          sx={{ display: { xs: 'block', sm: 'none' } }}
                        >
                          {expense.category}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{expense.category}</TableCell>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        ₹{expense.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        onClick={() => handleEdit(expense.id)} 
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDelete(expense.id)} 
                        size="small" 
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <NoExpensesMessage />
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Fab
        color="primary"
        sx={{
          position: "fixed",
          bottom: { xs: 16, sm: 20 },
          right: { xs: 16, sm: 20 },
          bgcolor: "#e82c2a",
          '&:hover': {
            bgcolor: "#c4241f"
          }
        }}
        onClick={() => navigate("/expense-form")}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};

export default Expenses;