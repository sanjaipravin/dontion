import { supabase } from './config.js';

// Mobile Navigation
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
    }
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // Close mobile menu after clicking a link
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });
});

// Animate elements when they come into view
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.stat-item, .cause-card, .donation-form, .contact-info');
    
    elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const screenPosition = window.innerHeight;
        
        if (elementPosition < screenPosition) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
};

// Set initial state for animated elements
document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.stat-item, .cause-card, .donation-form, .contact-info');
    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
});

// Listen for scroll events
window.addEventListener('scroll', animateOnScroll);

// Donation amount buttons
const amountButtons = document.querySelectorAll('.amount-btn');
const customAmountInput = document.querySelector('input[type="number"]');

amountButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        amountButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');
        // Update custom amount input
        const amount = button.textContent.replace('$', '');
        customAmountInput.value = amount;
    });
});

// Donation handling
const donationForm = document.querySelector('.donation-form form');
const contactForm = document.querySelector('.contact-form');
const donationsList = document.querySelector('.donations-list');
const donationSuccess = document.querySelector('.donation-success');

// Chart instances
let monthlyChart;
let distributionChart;

// Initialize charts
function initializeCharts() {
    // Monthly donations chart
    const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
    monthlyChart = new Chart(monthlyCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Monthly Donations',
                data: [],
                backgroundColor: '#4CAF50',
                borderColor: '#45a049',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });

    // Distribution chart
    const distributionCtx = document.getElementById('distributionChart').getContext('2d');
    distributionChart = new Chart(distributionCtx, {
        type: 'pie',
        data: {
            labels: ['$10', '$25', '$50', '$100', 'Custom'],
            datasets: [{
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    '#4CAF50',
                    '#2196F3',
                    '#FFC107',
                    '#9C27B0',
                    '#FF5722'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Fetch donations from Supabase
async function fetchDonations() {
    try {
        const { data: donations, error } = await supabase
            .from('donations')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        return donations || [];
    } catch (error) {
        console.error('Error fetching donations:', error);
        return [];
    }
}

// Save donation to Supabase
async function saveDonation(donation) {
    try {
        const { data, error } = await supabase
            .from('donations')
            .insert([{
                name: donation.name,
                amount: parseFloat(donation.amount),
                message: donation.message || null,
                date: new Date().toISOString()
            }]);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving donation:', error);
        throw error;
    }
}

// Display donations
async function displayDonations() {
    try {
        const donations = await fetchDonations();
        donationsList.innerHTML = '';
        
        donations.slice(0, 6).forEach(donation => {
            const donationCard = document.createElement('div');
            donationCard.className = 'donation-card';
            donationCard.innerHTML = `
                <div class="donor-name">${donation.name}</div>
                <div class="donation-amount">$${donation.amount}</div>
                <div class="donation-date">${new Date(donation.date).toLocaleDateString()}</div>
                ${donation.message ? `<div class="donation-message">"${donation.message}"</div>` : ''}
            `;
            donationsList.appendChild(donationCard);
        });

        // Update statistics
        updateStatistics(donations);
    } catch (error) {
        console.error('Error displaying donations:', error);
    }
}

// Update statistics
function updateStatistics(donations) {
    // Calculate monthly totals
    const monthlyTotals = {};
    const distribution = {
        '10': 0,
        '25': 0,
        '50': 0,
        '100': 0,
        'custom': 0
    };

    let totalAmount = 0;
    const uniqueDonors = new Set();

    donations.forEach(donation => {
        const date = new Date(donation.date);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        // Update monthly totals
        monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + Number(donation.amount);
        
        // Update distribution
        const amount = Number(donation.amount);
        if (amount === 10) distribution['10']++;
        else if (amount === 25) distribution['25']++;
        else if (amount === 50) distribution['50']++;
        else if (amount === 100) distribution['100']++;
        else distribution['custom']++;

        // Update total amount and unique donors
        totalAmount += amount;
        uniqueDonors.add(donation.name);
    });

    // Update monthly chart
    monthlyChart.data.labels = Object.keys(monthlyTotals);
    monthlyChart.data.datasets[0].data = Object.values(monthlyTotals);
    monthlyChart.update();

    // Update distribution chart
    distributionChart.data.datasets[0].data = Object.values(distribution);
    distributionChart.update();

    // Update summary statistics
    document.getElementById('totalAmount').textContent = `$${totalAmount.toFixed(2)}`;
    document.getElementById('totalDonors').textContent = uniqueDonors.size;
    document.getElementById('averageDonation').textContent = 
        `$${(totalAmount / donations.length || 0).toFixed(2)}`;
}

// Initialize charts and load data when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    initializeCharts();
    await displayDonations();

    // Set up donation form submission
    const donationForm = document.querySelector('.donation-form form');
    const donationSuccess = document.querySelector('.donation-success');

    donationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(donationForm);
        const donation = {
            name: formData.get('name'),
            amount: formData.get('amount'),
            message: formData.get('message')
        };

        try {
            // Save donation to Supabase
            await saveDonation(donation);

            // Show success message
            donationSuccess.classList.add('active');
            
            // Hide success message after 3 seconds
            setTimeout(() => {
                donationSuccess.classList.remove('active');
                donationForm.reset();
            }, 3000);

            // Update donations display
            await displayDonations();

            // Scroll to recent donations section
            document.querySelector('#recent-donations').scrollIntoView({
                behavior: 'smooth'
            });
        } catch (error) {
            console.error('Error processing donation:', error);
            alert('There was an error processing your donation. Please try again.');
        }
    });
});

// Update donation form to include name field
const nameInput = document.createElement('input');
nameInput.type = 'text';
nameInput.name = 'name';
nameInput.placeholder = 'Full Name';
nameInput.required = true;
donationForm.insertBefore(nameInput, donationForm.querySelector('input[type="email"]'));

// Update amount input to have a name
const amountInput = document.querySelector('input[type="number"]');
amountInput.name = 'amount';
amountInput.required = true;

// Add message textarea
const messageTextarea = document.createElement('textarea');
messageTextarea.name = 'message';
messageTextarea.placeholder = 'Add a message (optional)';
messageTextarea.rows = 3;
donationForm.insertBefore(messageTextarea, donationForm.querySelector('.submit-btn'));

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Add your contact form submission logic here
    alert('Thank you for your message! This is a demo website.');
    contactForm.reset();
}); 