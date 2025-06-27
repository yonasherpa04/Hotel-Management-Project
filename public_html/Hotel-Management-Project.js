// app.js

import * as api from './api.js';
import * as ui from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // Event listeners for navigation
    document.querySelectorAll('nav ul li a').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = event.target.getAttribute('href').substring(1);
            ui.showSection(targetId);

            // Specific actions for sections
            if (targetId === 'rooms') {
                loadRooms();
            } else if (targetId === 'bookings') {
                loadUserBookings();
                toggleBookingFormButton(localStorage.getItem('token') !== null);
            } else if (targetId === 'login') {
                ui.clearLoginMessage();
            }
        });
    });

    // Initial section display
    ui.showSection('home');

    // Event listener for "View Available Rooms" button
    document.getElementById('viewRoomsBtn').addEventListener('click', () => {
        ui.showSection('rooms');
        loadRooms();
    });

    // Event listener for login form submission
    document.getElementById('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const token = await api.loginUser(username, password);
            localStorage.setItem('token', token); // Store token
            ui.updateLoginLogoutLink(true);
            ui.showSection('home'); // Redirect to home or rooms after login
            ui.clearLoginMessage();
            toggleBookingFormButton(true); // Show create booking button after login
        } catch (error) {
            console.error('Login failed:', error);
            ui.setLoginMessage('Login failed. Invalid username or password.');
        }
    });

    // Handle logout
    document.getElementById('loginLogoutLink').addEventListener('click', (event) => {
        if (localStorage.getItem('token')) { // If logged in, this is a logout action
            event.preventDefault();
            localStorage.removeItem('token');
            ui.updateLoginLogoutLink(false);
            ui.showSection('home'); // Go to home after logout
            toggleBookingFormButton(false); // Hide create booking button after logout
            ui.clearBookingList(); // Clear bookings if logged out
        }
        // If not logged in, the link goes to #login, handled by the general nav listener
    });

    // Initial check for login status on page load
    ui.updateLoginLogoutLink(localStorage.getItem('token') !== null);
    toggleBookingFormButton(localStorage.getItem('token') !== null);


    // Event listener for "Create New Booking" button
    document.getElementById('createNewBookingBtn').addEventListener('click', () => {
        const bookingForm = document.getElementById('bookingForm');
        bookingForm.style.display = 'block';
        populateRoomTypeDropdown();
    });

    // Event listener for booking submission form
    document.getElementById('bookingSubmissionForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const roomType = document.getElementById('roomType').value;
        const checkInDate = document.getElementById('checkInDate').value;
        const checkOutDate = document.getElementById('checkOutDate').value;

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in to create a booking.');
            ui.showSection('login');
            return;
        }

        try {
            const newBooking = await api.createBooking({ roomType, checkInDate, checkOutDate }, token);
            alert('Booking created successfully!');
            document.getElementById('bookingSubmissionForm').reset(); // Clear form
            document.getElementById('bookingForm').style.display = 'none'; // Hide form
            loadUserBookings(); // Reload user bookings
        } catch (error) {
            console.error('Booking creation failed:', error);
            alert('Failed to create booking. ' + (error.message || 'Please try again.'));
        }
    });
});

async function loadRooms() {
    try {
        const rooms = await api.getRooms();
        ui.displayRooms(rooms);
    } catch (error) {
        console.error('Error loading rooms:', error);
        document.getElementById('roomList').innerHTML = '<p>Failed to load rooms. Please try again later.</p>';
    }
}

async function loadUserBookings() {
    const token = localStorage.getItem('token');
    if (!token) {
        ui.displayBookings([]); // Clear existing bookings if not logged in
        document.getElementById('bookingList').innerHTML = '<p>Please log in to view your bookings.</p>';
        return;
    }
    try {
        const bookings = await api.getUserBookings(token);
        ui.displayBookings(bookings);
    } catch (error) {
        console.error('Error loading user bookings:', error);
        document.getElementById('bookingList').innerHTML = '<p>Failed to load your bookings. ' + (error.message || 'Please try again later.') + '</p>';
    }
}

async function populateRoomTypeDropdown() {
    const roomTypeSelect = document.getElementById('roomType');
    roomTypeSelect.innerHTML = '<option value="">Select a room type</option>'; // Reset options

    try {
        const rooms = await api.getRooms(); // Get available rooms
        const uniqueRoomTypes = [...new Set(rooms.map(room => room.type))]; // Get unique types
        uniqueRoomTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            roomTypeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to populate room types:', error);
        // Fallback or error message for user
    }
}

function toggleBookingFormButton(isLoggedIn) {
    const createButton = document.getElementById('createNewBookingBtn');
    if (createButton) {
        createButton.style.display = isLoggedIn ? 'block' : 'none';
    }
}