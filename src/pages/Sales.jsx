import React, { useState, useEffect } from 'react';
import { SalesForm } from '../components/SalesForm';
import {
  Container, Fab, Typography, Grid, TextField, FormControl,
  InputLabel, Select, MenuItem, Stack, Chip, TableContainer,
  Paper, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Box, Card, CardContent, Dialog, DialogTitle, 
  DialogContent, DialogActions, Button, CircularProgress  // Add CircularProgress here
} from '@mui/material';
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";  // Fix the import path (remove the dot)
import DeleteIcon from "@mui/icons-material/Delete";  // Fix the path (remove the dot)
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PaymentIcon from '@mui/icons-material/Payment';
import SearchIcon from '@mui/icons-material/Search'; // Add missing import
import { collection, query, getDocs, deleteDoc, doc, addDoc, updateDoc, orderBy, where } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

const Sales = () => {
  // Remove duplicate filter state and add loading/error states
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [dateFilterType, setDateFilterType] = useState("thisMonth");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const handleCreateInvoice = async (formData) => {
    try {
      const userId = auth.currentUser.uid;
      const salesRef = collection(db, `users/${userId}/sales`);
      
      // Generate the next invoice number
      const lastInvoiceNumber = getLastInvoiceNumber();
      const nextInvoiceNumber = (lastInvoiceNumber + 1).toString().padStart(3, '0'); // Format as 3 digits

      const docRef = await addDoc(salesRef, {
        ...formData,
        invoiceNumber: `INV/${nextInvoiceNumber}/${new Date().getFullYear()}`, // Example format: INV/001/2023
        createdAt: new Date().toISOString()
      });
      console.log('Invoice created with ID:', docRef.id); // Debug log
      await fetchInvoices();
      setShowForm(false);
    } catch (error) {
      console.error("Error creating invoice:", error);
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleUpdate = async (formData) => {
    try {
      const userId = auth.currentUser.uid;
      const invoiceRef = doc(db, `users/${userId}/sales/${editingInvoice.id}`);
      await updateDoc(invoiceRef, formData);
      await fetchInvoices();
      setEditingInvoice(null);
      setShowForm(false);
    } catch (error) {
      console.error("Error updating invoice:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      if (window.confirm('Are you sure you want to delete this invoice?')) {
        const userId = auth.currentUser.uid;
        await deleteDoc(doc(db, `users/${userId}/sales/${id}`));
        await fetchInvoices();
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  const handlePaymentUpdate = async (invoice, amount) => {
    try {
      const userId = auth.currentUser.uid;
      const invoiceRef = doc(db, `users/${userId}/sales/${invoice.id}`);
      const newPaidAmount = Number(invoice.paidAmount || 0) + Number(amount);
      const total = Number(invoice.total);
      
      await updateDoc(invoiceRef, {
        paidAmount: newPaidAmount,
        paymentStatus: newPaidAmount >= total ? 'paid' : 'partial',
        remainingAmount: total - newPaidAmount,
        lastPaymentDate: new Date().toISOString()
      });
      
      await fetchInvoices();
      setShowPaymentDialog(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error("Error updating payment:", error);
    }
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    // Add logic to view invoice details
  };

  useEffect(() => {
    // Set initial date range and fetch invoices
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setDateRange({ start: startOfMonth, end: endOfMonth });
    
    if (auth.currentUser) {
      fetchInvoices();
    }
  }, [auth.currentUser]); // Add dependency on auth.currentUser

  // Add error handling to fetchInvoices
  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!auth.currentUser) {
        setInvoices([]);
        return;
      }
      const userId = auth.currentUser.uid;
      const salesRef = collection(db, `users/${userId}/sales`);
      const q = query(
        salesRef,
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const invoicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Fetched invoices:', invoicesData); // Debug log
      setInvoices(invoicesData);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (type) => {
    const now = new Date();
    let start, end;

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
      default:
        return;
    }
    
    setDateFilterType(type);
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  };

  // Update getFilteredInvoices to handle null values
  const getFilteredInvoices = () => {
    if (!invoices) return [];
    let filtered = [...invoices];
    
    if (search) {
      filtered = filtered.filter((invoice) =>
        invoice.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        invoice.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceDate >= dateRange.start && 
          invoice.invoiceDate <= dateRange.end
      );
    }

    // Fix filter logic
    switch (filter) {
      case "pending":
        filtered = filtered.filter(invoice => invoice.paymentStatus === 'pending');
        break;
      case "partial":
        filtered = filtered.filter(invoice => invoice.paymentStatus === 'partial');
        break;
      case "paid":
        filtered = filtered.filter(invoice => invoice.paymentStatus === 'paid');
        break;
    }

    return filtered;
  };

  const getLastInvoiceNumber = () => {
    if (invoices.length === 0) return 0;
    
    const numbers = invoices.map(invoice => {
      const match = invoice.invoiceNumber?.match(/\/(\d+)\//);
      return match ? parseInt(match[1]) : 0;
    });
    
    return Math.max(...numbers);
  };

  // Add missing table content
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 4 }, bgcolor: '#fff' }}>
      {error ? (
        <Box sx={{ color: '#e82c2a', textAlign: 'center', my: 2 }}>
          Error: {error}
        </Box>
      ) : loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress sx={{ color: '#e82c2a' }} />
        </Box>
      ) : !showForm ? (
        <>
          <Box sx={{ mb: { xs: 2, md: 4 }, mt: { xs: 1, md: 2 } }}>
            <Typography 
              variant="h4" 
              sx={{ 
                color: '#e82c2a',
                fontWeight: 'bold',
                mb: 2,
                fontSize: { xs: '1.5rem', md: '2rem' } // Adjust font size for mobile
              }}
            >
              Sales Invoices
            </Typography>
            
            <Card sx={{ mb: 2, border: '1px solid #e0e0e0', bgcolor: '#fff' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Search invoice or customer"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                          startAdornment: <SearchIcon sx={{ color: '#000', mr: 1 }} />
                        }}
                        sx={{ bgcolor: '#fff' }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>
                          <Box sx={{ display: 'flex', alignItems: 'center', color: '#000' }}>
                            <FilterListIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                            Filter Status
                          </Box>
                        </InputLabel>
                        <Select
                          value={filter}
                          onChange={(e) => setFilter(e.target.value)}
                          sx={{ bgcolor: '#fff' }}
                        >
                          <MenuItem value="">All</MenuItem>
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="partial">Partial</MenuItem>
                          <MenuItem value="paid">Paid</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}> {/* Wrap chips for mobile */}
                        <Chip
                          label="This Month"
                          onClick={() => handleDateFilterChange("thisMonth")}
                          color={dateFilterType === "thisMonth" ? "primary" : "default"}
                          sx={{
                            bgcolor: dateFilterType === "thisMonth" ? '#e82c2a' : '#e0e0e0',
                            color: dateFilterType === "thisMonth" ? '#fff' : '#000'
                          }}
                        />
                        <Chip
                          label="Last Month"
                          onClick={() => handleDateFilterChange("lastMonth")}
                          sx={{
                            bgcolor: dateFilterType === "lastMonth" ? '#e82c2a' : '#e0e0e0',
                            color: dateFilterType === "lastMonth" ? '#fff' : '#000'
                          }}
                        />
                        <Chip
                          label="Custom"
                          onClick={() => setDateFilterType("custom")}
                          sx={{
                            bgcolor: dateFilterType === "custom" ? '#e82c2a' : '#e0e0e0',
                            color: dateFilterType === "custom" ? '#fff' : '#000'
                          }}
                        />
                      </Stack>
                    </Grid>
                  </Grid>

                  {dateFilterType === "custom" && (
                    <Grid container spacing={{ xs: 1, md: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Start Date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                          InputLabelProps={{ shrink: true }}
                          sx={{ bgcolor: '#fff' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          type="date"
                          label="End Date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                          InputLabelProps={{ shrink: true }}
                          sx={{ bgcolor: '#fff' }}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <TableContainer 
              component={Paper}
              sx={{ 
                border: '1px solid #e0e0e0',
                '& .MuiTableCell-root': {
                  px: { xs: 1, sm: 2 },
                  py: 1,
                  color: '#000',
                  bgcolor: '#fff',
                  fontSize: { xs: '0.8rem', sm: '1rem' } // Adjust font size for mobile
                }
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#e82c2a' }}>
                    <TableCell sx={{ color: '#fff' }}>Invoice #</TableCell>
                    <TableCell sx={{ color: '#fff' }}>Date</TableCell>
                    <TableCell sx={{ color: '#fff' }}>Customer</TableCell>
                    <TableCell sx={{ color: '#fff' }} align="right">Amount</TableCell>
                    <TableCell sx={{ color: '#fff' }} align="right">Paid</TableCell>
                    <TableCell sx={{ color: '#fff' }} align="right">Balance</TableCell>
                    <TableCell sx={{ color: '#fff' }}>Status</TableCell>
                    <TableCell sx={{ color: '#fff' }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getFilteredInvoices().map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.invoiceDate}</TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                      <TableCell align="right">₹{invoice.total}</TableCell>
                      <TableCell align="right">₹{invoice.paidAmount || 0}</TableCell>
                      <TableCell align="right">
                        ₹{(invoice.total - (invoice.paidAmount || 0)).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={invoice.paymentStatus}
                          sx={{
                            bgcolor: invoice.paymentStatus === 'paid' ? '#4caf50' :
                                    invoice.paymentStatus === 'partial' ? '#ff9800' : '#f44336',
                            color: '#fff'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleEdit(invoice)}>
                          <EditIcon sx={{ color: '#000' }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(invoice.id)}>
                          <DeleteIcon sx={{ color: '#000' }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowPaymentDialog(true);
                        }}>
                          <PaymentIcon sx={{ color: '#000' }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Fab
            color="primary"
            aria-label="add"
            onClick={() => setShowForm(true)}
            sx={{
              position: 'fixed',
              bottom: { xs: 16, md: 32 },
              right: { xs: 16, md: 32 },
              bgcolor: '#e82c2a',
              '&:hover': {
                bgcolor: '#c4241f'
              }
            }}
          >
            <AddIcon />
          </Fab>
        </>
      ) : (
        <SalesForm 
          onSubmit={editingInvoice ? handleUpdate : handleCreateInvoice} // Fix: change onSave to onSubmit
          initialData={editingInvoice} // Fix: change editingInvoice to initialData
          onCancel={() => {
            setShowForm(false);
            setEditingInvoice(null);
          }}
          lastInvoiceNumber={getLastInvoiceNumber()}
        />
      )}

      <Dialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
      >
        <DialogTitle sx={{ color: '#e82c2a' }}>Record Payment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Payment Amount"
            type="number"
            fullWidth
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            sx={{ bgcolor: '#fff' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentDialog(false)} sx={{ color: '#000' }}>Cancel</Button>
          <Button
            onClick={() => handlePaymentUpdate(selectedInvoice, paymentAmount)}
            sx={{ bgcolor: '#e82c2a', color: '#fff', '&:hover': { bgcolor: '#c4241f' } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Sales;
