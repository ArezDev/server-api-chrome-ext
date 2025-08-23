import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { FaEdit, FaTrashAlt, FaSync } from "react-icons/fa"; // Import icons
import Swal from "sweetalert2"; // Import SweetAlert2

export default function AdminPage() {
  const router = useRouter();
  const [userList, setUserList] = useState([]);

  useEffect(() => {
    const auth = async () => {
      try {
        const res = await axios.get("/api/admin/auth");

        // Check if user is authenticated
        if (res.status === 403 || !res.data.authenticated) {
          // Redirect to login page if not authenticated
          router.push('/admin/login');
        }
      } catch (error) {
        console.error("Error fetching authentication status:", error);
        // Optionally, handle the error more gracefully
        router.push('/admin/login'); // Redirect to login on error (could be customized)
      }
    };

    auth();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/users/list");
        setUserList(response.data.users); // Adjust this as per your API response
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchData();
  }, []);

  const fetchUserList = async () => {
    try {
      const response = await axios.get("/api/users/list");
      // Assuming you set the fetched data in a state, like setUserList
      setUserList(response.data?.users || []); // Example of updating state
    } catch (error) {
      console.error("Error fetching user list:", error);
    }
  };

  // Function user create
  const handleCreate = () => {
    Swal.fire({
      title: `Create UserId`,
      html: `
        <input type="text" id="username" class="swal2-input" placeholder="Username">
        <input type="password" id="password" class="swal2-input" placeholder="Password">
        <input type="number" id="maxchrome" class="swal2-input" placeholder="max chrome (100-200)">
      `,
      focusConfirm: false, // Focus input when alert is shown
      showCancelButton: true,
      preConfirm: () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const maxchrome = document.getElementById('maxchrome').value;

        // Check if username is empty
        if (!username || !password) {
          Swal.showValidationMessage('username and password required!');
          return false;
        }

        // Return both fields if they are valid
        return { username: username, password: password, maxchrome: maxchrome };
      },
      // Custom validation error handling
      didOpen: () => {
        document.getElementById('username').focus(); // Focus on username field by default
      }
    }).then(async(result) => {
      if (result.isConfirmed) {
        // Greet user with the input data
        const { username, password, maxchrome } = result.value;
        try {
          const editUser = await axios.post(`/api/users/create`, { username, password, maxchrome });
          if (editUser.data?.success) {
            Swal.fire('Create user success!', '', 'success');
            await fetchUserList();
          } else {
            Swal.fire('Create user failed!', editUser.data?.message, 'error');
          }
        } catch (error) {
          Swal.fire('Create user failed!', error.message, 'error');
        }
      }
    });
  };

  // ISO (UTC) -> "YYYY-MM-DDTHH:mm" lokal untuk <input type="datetime-local">
  function isoUtcToLocalInputValue(isoUtc) {
    const d = new Date(isoUtc);                     // Date pada zona lokal, mewakili waktu UTC tsb
    const tzOffsetMs = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - tzOffsetMs); // geser supaya toISOString() menghasilkan lokal
    return local.toISOString().slice(0, 16);          // "YYYY-MM-DDTHH:mm"
  }

  // "YYYY-MM-DDTHH:mm" lokal -> ISO UTC
  function localInputValueToIsoUtc(localVal) {
    // new Date(localVal) dibaca sebagai waktu lokal; toISOString() mengubahnya ke UTC
    return new Date(localVal).toISOString();
  }

  // Function to handle user editing
  const handleEdit = async (userId, username, maxchrome, akses) => {
    Swal.fire({
      title: `Edit ${username}`,
      html: `
        <input type="text" id="username" class="swal2-input" value="${username}">
        <input type="password" id="password" class="swal2-input" placeholder="New password (optional)">
        <input type="number" id="maxchrome" class="swal2-input" value="${maxchrome}">
        <input id="waktu_access" class="swal2-input" type="datetime-local" value="${isoUtcToLocalInputValue(akses)}" step="60">
      `,
      focusConfirm: false, // Focus input when alert is shown
      showCancelButton: true,
      preConfirm: () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const maxchrome = document.getElementById('maxchrome').value;
        const akses = document.getElementById('waktu_access').value;

        // Check if username is empty
        if (!username) {
          Swal.showValidationMessage('Please enter a username!');
          return false;
        }

        // If both fields are empty, show a validation message
        if (!password) {
          return { username: username, password: null, maxchrome: maxchrome, akses: akses }; // Optional password, can be null
        }

        // Return both fields if they are valid
        return { username: username, password: password, maxchrome: maxchrome, akses: akses };
      },
      // Custom validation error handling
      didOpen: () => {
        document.getElementById('username').focus(); // Focus on username field by default
      }
    }).then(async(result) => {
      if (result.isConfirmed) {
        // Greet user with the input data
        const { username, password, maxchrome, akses } = result.value;
        
        try {
          const editUser = await axios.put(`/api/users/${userId}`, { username, password, maxchrome, edit_akses: localInputValueToIsoUtc(akses) });
          if (editUser.data?.success) {
            Swal.fire('Edit user success!', '', 'success');

            await fetchUserList();
          } else {
            Swal.fire('Edit user failed!', editUser.data?.message, 'error');
          }
        } catch (error) {
          Swal.fire('Edit user failed!', error.message, 'error');
        }
      }
    });
  };

  // Function to handle user deletion
  const handleDelete = (userId, username) => {
    Swal.fire({
      title: `Delete user ${username}?`,
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`/api/users/${userId}`);
          Swal.fire("Deleted!", "User has been deleted.", "success");
          // Optionally, you can re-fetch the users or update state to remove the deleted user
          //setUserList((prevList) => prevList.filter((user) => user.id !== userId));
          await fetchUserList();
        } catch (error) {
          Swal.fire("Error!", "There was a problem deleting the user.", "error");
        }
      }
    });
  };

  const resetInstalledChrome = (userId, username) => {
    Swal.fire({
      title: `Reset chrome terinstall ${username}?`,
      text: "",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await axios.delete(`/api/users/reset-chrome?id=${userId}`);
          if (res.data?.success) {
            Swal.fire("Reset chrome done!", JSON.stringify(res.data), "success");
          } else {
            Swal.fire("Reset chrome error!", JSON.stringify(res.data), "error");
          }
          
          // Optionally, you can re-fetch the users or update state to remove the deleted user
          //setUserList((prevList) => prevList.filter((user) => user.id !== userId));
          await fetchUserList();
        } catch (error) {
          Swal.fire("Error!", error.message, "error");
        }
      }
    });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Admin Panel</h1>

      {/* Container for User List and Add User Button */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          {/* Left - User List Header */}
          <h2 className="text-xl font-semibold text-gray-800">Total user {`(${userList.length})`}</h2>

          {/* Right - Add User Button */}
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition"
            onClick={() => handleCreate()}
          >
            Tambah User
          </button>
        </div>

        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-2 px-4 text-left text-gray-600">UserId</th>
              <th className="py-2 px-4 text-left text-gray-600">Installed Chrome</th>
              <th className="py-2 px-4 text-left text-gray-600">Max Chrome</th>
              <th className="py-2 px-4 text-left text-gray-600">Access</th>
              <th className="py-2 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {userList.map((user, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">{user.username}</td>
                <td className="py-2 px-10">
                  <div className="flex items-center space-x-2">
                    <span>{user.total_chrome}</span>
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() =>
                        resetInstalledChrome(user.id, user.username)
                      }
                    >
                      <FaSync />
                    </button>
                  </div>
                </td>
                <td className="py-2 px-8">{user.max_chrome}</td>
                <td className="py-2 px-4">{isoUtcToLocalInputValue(user.akses).split('T')[0]}</td>
                <td className="py-2 px-4 text-center space-x-4">
                  <button
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => handleEdit(user.id, user.username, user.max_chrome, user.akses)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() => handleDelete(user.id, user.username)}
                  >
                    <FaTrashAlt />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
