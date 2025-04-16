import React, { useState, useEffect } from 'react';
import {
  Container, TextField, Button, IconButton, Grid, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Box, FormControl, InputLabel, Select, MenuItem,
  Card, CardContent, CardHeader, Divider, Checkbox, FormControlLabel,
  Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

export const PurchaseForm = ({ onSubmit, initialData, onCancel, lastPurchaseNumber }) => {
  const [formData, setFormData] = useState(initialData || {
    purchasePrefix: 'PO',
    purchaseSuffix: new Date().getFullYear().toString(),
    purchaseNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    vendorName: '',
    vendorEmail: '',
    items: [{ productName: '', quantity: 1, price: 0, gst: 18 }],
    paymentMode: 'cash',
    paidAmount: 0,
    isPaidFully: false,
    paymentStatus: 'pending'
  });

  const [errors, setErrors] = useState({});

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => 
      sum + (item.quantity * item.price), 0
    );
  };

  const calculateGST = () => {
    return formData.items.reduce((sum, item) => 
      sum + (item.quantity * item.price * item.gst / 100), 0
    );
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateGST();
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productName: '', quantity: 1, price: 0, gst: 18 }]
    });
  };

  const handleRemoveItem = (index) => {
    const items = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items });
  };

  const handleItemChange = (index, field, value) => {
    const items = formData.items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setFormData({ ...formData, items });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    const errors = {};
    if (!formData.vendorName.trim()) {
      errors.vendorName = 'Vendor name is required';
    }
    if (!formData.purchaseNumber.trim()) {
      errors.purchaseNumber = 'Purchase number is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    // Calculate totals
    const finalData = {
      ...formData,
      subTotal: calculateSubtotal(),
      gstTotal: calculateGST(),
      total: calculateTotal(),
      paymentStatus: formData.isPaidFully ? 'paid' : 
        (formData.paidAmount > 0 ? 'partial' : 'pending'),
      remainingAmount: formData.isPaidFully ? 0 : 
        (calculateTotal() - (formData.paidAmount || 0))
    };

    onSubmit(finalData);
  };

  const generatePurchaseNumber = () => {
    let currentNumber = typeof lastPurchaseNumber === 'string' 
      ? parseInt(lastPurchaseNumber.split('-')[1], 10) || 0 
      : 0;
  
    let nextNumber;
    let newPurchaseNumber;
  
    do {
      currentNumber += 1;
      nextNumber = String(currentNumber).padStart(3, '0');
      newPurchaseNumber = `${formData.purchasePrefix}-${nextNumber}-${formData.purchaseSuffix}`;
    } while (newPurchaseNumber === lastPurchaseNumber);
  
    return newPurchaseNumber;
  };

  useEffect(() => {
    if (!initialData && lastPurchaseNumber !== undefined) {
      const newPurchaseNumber = generatePurchaseNumber();
      setFormData(prev => ({
        ...prev,
        purchaseNumber: newPurchaseNumber
      }));
    }
  }, [lastPurchaseNumber, formData.purchasePrefix, formData.purchaseSuffix]);

  const cardStyle = {
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 12px rgba(232,44,42,0.15)',
      borderColor: '#e82c2a'
    }
  };

  const cardHeaderStyle = {
    bgcolor: '#f8f8f8',
    borderBottom: '2px solid #e82c2a',
    '& .MuiCardHeader-title': {
      color: '#e82c2a',
      fontWeight: 'bold',
      fontSize: '1.2rem'
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ 
        mb: { xs: 2, md: 4 }, 
        fontSize: { xs: '1.5rem', md: '2rem' },
        color: '#e82c2a', 
        fontWeight: 'bold' 
      }}>
        {initialData ? 'Edit Purchase Order' : 'Create New Purchase Order'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {/* Purchase Order Details Section */}
          <Grid xs={12}>
            <Card sx={cardStyle}>
              <CardHeader 
                title="Purchase Order Details" 
                sx={cardHeaderStyle}
              />
              <CardContent>
                <Grid container spacing={{ xs: 1, md: 3 }}>
                  <Grid xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Purchase Order Prefix"
                      value={formData.purchasePrefix}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        purchasePrefix: e.target.value 
                      })}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Purchase Order Number"
                      value={formData.purchaseNumber}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Purchase Order Suffix (Year)"
                      value={formData.purchaseSuffix}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        purchaseSuffix: e.target.value 
                      })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Purchase Date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: '#e82c2a'
                        }
                      }}}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Due Date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Vendor Details Section */}
          <Grid item xs={12}>
            <Card sx={cardStyle}>
              <CardHeader 
                title="Vendor Information" 
                sx={cardHeaderStyle}
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      required
                      error={!!errors?.vendorName}
                      helperText={errors?.vendorName}
                      label="Vendor Name"
                      value={formData.vendorName}
                      onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Vendor Email"
                      type="email"
                      value={formData.vendorEmail}
                      onChange={(e) => setFormData({ ...formData, vendorEmail: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Products Section */}
          <Grid xs={12}>
            <Card sx={cardStyle}>
              <CardHeader title="Product Details" sx={cardHeaderStyle} />
              <CardContent>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>GST %</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={item.productName}
                              onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={item.price}
                              onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              size="small"
                              value={item.gst}
                              onChange={(e) => handleItemChange(index, 'gst', Number(e.target.value))}
                            >
                              <MenuItem value={0}>0%</MenuItem>
                              <MenuItem value={5}>5%</MenuItem>
                              <MenuItem value={12}>12%</MenuItem>
                              <MenuItem value={18}>18%</MenuItem>
                              <MenuItem value={28}>28%</MenuItem>
                            </Select>
                          </TableCell>
                          <TableCell>
                            ₹{(item.quantity * item.price).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <IconButton 
                              size="small" 
                              onClick={() => handleRemoveItem(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button 
                  startIcon={<AddIcon />} 
                  onClick={handleAddItem}
                  sx={{ 
                    mt: 2,
                    bgcolor: '#e82c2a',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#c4241f'
                    }
                  }}
                >
                  Add Item
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Section */}
          <Grid xs={12}>
            <Card sx={cardStyle}>
              <CardHeader title="Payment Information" sx={cardHeaderStyle} />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid xs={12} md={6}>
                    <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography>Subtotal: ₹{calculateSubtotal().toFixed(2)}</Typography>
                      <Typography>GST: ₹{calculateGST().toFixed(2)}</Typography>
                      <Typography variant="h6" sx={{ color: '#e82c2a' }}>
                        Total: ₹{calculateTotal().toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid xs={12} md={6}>
                    <Stack spacing={2}>
                      <FormControl fullWidth>
                        <InputLabel>Payment Mode</InputLabel>
                        <Select
                          value={formData.paymentMode}
                          onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                        >
                          <MenuItem value="cash">Cash</MenuItem>
                          <MenuItem value="card">Card</MenuItem>
                          <MenuItem value="upi">UPI</MenuItem>
                          <MenuItem value="bank">Bank Transfer</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        type="number"
                        label="Paid Amount"
                        value={formData.paidAmount}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          paidAmount: Number(e.target.value),
                          isPaidFully: Number(e.target.value) >= calculateTotal()
                        })}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.isPaidFully}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              isPaidFully: e.target.checked,
                              paidAmount: e.target.checked ? calculateTotal() : formData.paidAmount
                            })}
                          />
                        }
                        label="Mark as Fully Paid"
                      />
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Action Buttons */}
          <Grid xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={onCancel}
                sx={{ 
                  borderColor: '#e82c2a',
                  color: '#e82c2a',
                  '&:hover': {
                    borderColor: '#c4241f',
                    bgcolor: 'rgba(232, 44, 42, 0.1)'
                  }
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                variant="contained"
                sx={{ 
                  bgcolor: '#e82c2a',
                  '&:hover': {
                    bgcolor: '#c4241f'
                  }
                }}
              >
                {initialData ? 'Update Purchase Order' : 'Save Purchase Order'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default PurchaseForm;
