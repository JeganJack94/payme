import React, { useState, useEffect } from 'react';
import { PurchaseForm } from '../components/PurchaseForm';
import {
  Container, Button, Box, Typography, TextField, MenuItem, 
  Card, CardContent, IconButton, Stack, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  FormControl, InputLabel, Select, Fab, useMediaQuery
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentIcon from '@mui/icons-material/Payment';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { collection, query, getDocs, deleteDoc, doc, addDoc, updateDoc, orderBy } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { useTheme } from '@mui/material/styles';

const Purchases = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showForm, setShowForm] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [editingPurchase, setEditingPurchase] = useState(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [dateFilterType, setDateFilterType] = useState("thisMonth");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    if (auth.currentUser) {
      fetchPurchases();
    }
  }, [auth.currentUser]);

  const handleSubmit = async (purchaseData) => {
    try {
      const userId = auth.currentUser.uid;
      const purchasesRef = collection(db, `users/${userId}/purchases`);
      const lastPurchase = purchases[0];
      const lastPONumber = lastPurchase?.purchaseNumber?.replace("PO", "") || "0000";
      const newPONumber = `PO${(parseInt(lastPONumber, 10) + 1).toString().padStart(4, "0")}`;

      const newPurchase = {
        ...purchaseData,
        purchaseNumber: newPONumber,
        createdAt: new Date().toISOString(),
        purchaseDate: purchaseData.purchaseDate || new Date().toISOString().split('T')[0],
        total: Number(purchaseData.total || 0),
        paidAmount: 0,
        paymentStatus: 'pending',
        remainingAmount: Number(purchaseData.total || 0),
      };
      await addDoc(purchasesRef, newPurchase);
      await fetchPurchases();
      setShowForm(false);
    } catch (error) {
      console.error("Error creating purchase:", error);
    }
  };

  const handleUpdate = async (formData) => {
    try {
      const userId = auth.currentUser.uid;
      const purchaseRef = doc(db, `users/${userId}/purchases/${editingPurchase.id}`);
      await updateDoc(purchaseRef, formData);
      await fetchPurchases();
      setEditingPurchase(null);
      setShowForm(false);
    } catch (error) {
      console.error("Error updating purchase:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      try {
        const userId = auth.currentUser.uid;
        await deleteDoc(doc(db, `users/${userId}/purchases/${id}`));
        await fetchPurchases();
      } catch (error) {
        console.error("Error deleting purchase:", error);
      }
    }
  };

  const handlePaymentUpdate = async (purchase, amount) => {
    try {
      const userId = auth.currentUser.uid;
      const purchaseRef = doc(db, `users/${userId}/purchases/${purchase.id}`);
      const newPaidAmount = Number(purchase.paidAmount || 0) + Number(amount);
      const total = Number(purchase.total);

      await updateDoc(purchaseRef, {
        paidAmount: newPaidAmount,
        paymentStatus: newPaidAmount >= total ? 'paid' : 'partial',
        remainingAmount: total - newPaidAmount,
        lastPaymentDate: new Date().toISOString()
      });

      await fetchPurchases();
      setShowPaymentDialog(false);
      setSelectedPurchase(null);
    } catch (error) {
      console.error("Error updating payment:", error);
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

  const getFilteredPurchases = () => {
    if (!purchases) return [];
    let filtered = [...purchases];

    if (search) {
      filtered = filtered.filter((purchase) =>
        purchase.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
        purchase.purchaseNumber?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(
        (purchase) =>
          purchase.purchaseDate >= dateRange.start && 
          purchase.purchaseDate <= dateRange.end
      );
    }

    switch (filter) {
      case "pending":
        filtered = filtered.filter(purchase => purchase.paymentStatus === 'pending');
        break;
      case "partial":
        filtered = filtered.filter(purchase => purchase.paymentStatus === 'partial');
        break;
      case "paid":
        filtered = filtered.filter(purchase => purchase.paymentStatus === 'paid');
        break;
    }

    return filtered;
  };

  const fetchPurchases = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!auth.currentUser) {
        setPurchases([]);
        return;
      }
      const userId = auth.currentUser.uid;
      const purchasesRef = collection(db, `users/${userId}/purchases`);
      const q = query(purchasesRef, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      const purchasesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        total: Number(doc.data().total || 0),
        paidAmount: Number(doc.data().paidAmount || 0),
        remainingAmount: Number(doc.data().remainingAmount || 0),
      }));

      setPurchases(purchasesData);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (showForm) {
    return (
      <PurchaseForm 
        onSubmit={editingPurchase ? handleUpdate : handleSubmit}
        initialData={editingPurchase}
        onCancel={() => {
          setShowForm(false);
          setEditingPurchase(null);
        }}
        lastPurchaseNumber={purchases.length}
      />
    );
  }

  return (
    <Container maxWidth="xl" sx={{ px: isMobile ? 1 : 3 }}>
      {error ? (
        <Box sx={{ color: 'error.main', textAlign: 'center', my: 2 }}>
          Error: {error}
        </Box>
      ) : loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ py: { xs: 1, md: 4 } }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mb: { xs: 2, md: 4 },
            mt: { xs: 1, md: 2 }
          }}>
            <Typography 
              variant="h4" 
              sx={{ 
                color: '#e82c2a',
                fontSize: { xs: '1.5rem', md: '2rem' },
                fontWeight: 'bold'
              }}
            >
              Purchases
            </Typography>
          </Box>

          {/* Filters Card - Mobile Optimized */}
          <Card sx={{ mb: { xs: 2, md: 4 }, border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search purchase or vendor"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                  }}
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Filter Status</InputLabel>
                  <Select
                    value={filter}
                    label="Filter Status"
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="partial">Partial</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1, 
                  justifyContent: 'center' 
                }}>
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
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Purchases Table - Mobile Optimized */}
          <TableContainer 
            component={Paper}
            sx={{ 
              border: '1px solid #e0e0e0',
              '& .MuiTableCell-root': {
                px: { xs: 1, sm: 2 },
                py: 1,
                whiteSpace: 'nowrap'
              }
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>PO #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Vendor</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Paid</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredPurchases().map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>{purchase.purchaseNumber}</TableCell>
                    <TableCell>{purchase.purchaseDate}</TableCell>
                    <TableCell>{purchase.vendorName}</TableCell>
                    <TableCell align="right">${purchase.total?.toFixed(2)}</TableCell>
                    <TableCell align="right">${purchase.paidAmount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell align="right">
                      ${((purchase.total || 0) - (purchase.paidAmount || 0)).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={purchase.paymentStatus}
                        color={
                          purchase.paymentStatus === 'paid' ? 'success' :
                          purchase.paymentStatus === 'partial' ? 'warning' : 'error'
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setEditingPurchase(purchase);
                            setShowForm(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(purchase.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setSelectedPurchase(purchase);
                            setShowPaymentDialog(true);
                          }}
                        >
                          <PaymentIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* FAB Button */}
          <Fab
            color="primary"
            aria-label="add purchase"
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
        </Box>
      )}

      {/* Payment Dialog */}
      <Dialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Payment Amount"
            type="number"
            fullWidth
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
          <Button
            onClick={() => handlePaymentUpdate(selectedPurchase, paymentAmount)}
            color="primary"
            variant="contained"
            sx={{ 
              bgcolor: '#e82c2a',
              '&:hover': { bgcolor: '#c4241f' }
            }}
          >
            Save Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Purchases;