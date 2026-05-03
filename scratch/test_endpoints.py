import sys, os, requests

base_url = "http://localhost:8000/api"

# 1. Add Employee
emp_data = {
    "FullName": "Test User",
    "DateOfBirth": "1990-01-01",
    "Gender": "M",
    "PhoneNumber": "123456789",
    "Email": "test@example.com",
    "HireDate": "2020-01-01",
    "DepartmentID": 1,
    "PositionID": 1,
    "Status": "Active"
}

print("Adding Employee...")
r = requests.post(f"{base_url}/hr/employees", json=emp_data)
print(r.status_code, r.text)

if r.status_code == 200:
    emp = r.json()
    emp_id = emp["EmployeeID"]
    
    # 2. Add Salary
    salary_data = {
        "EmployeeID": emp_id,
        "SalaryMonth": "2026-05-01",
        "BaseSalary": 5000,
        "NetSalary": 4000
    }
    print("Adding Salary...")
    r_sal = requests.post(f"{base_url}/payroll/salaries", json=salary_data)
    print(r_sal.status_code, r_sal.text)
    
    if r_sal.status_code == 200:
        sal = r_sal.json()
        sal_id = sal["SalaryID"]
        
        # 3. Update Salary
        sal["BaseSalary"] = 6000
        print("Updating Salary...")
        r_upd_sal = requests.put(f"{base_url}/payroll/salaries/{sal_id}", json=sal)
        print(r_upd_sal.status_code, r_upd_sal.text)
        
        # 4. Try to delete employee (should fail because salary exists)
        print("Trying to delete employee (should fail)...")
        r_fail = requests.delete(f"{base_url}/hr/employees/{emp_id}")
        print(r_fail.status_code, r_fail.text)
        
        # 5. Delete salary
        print("Deleting salary...")
        r_del_sal = requests.delete(f"{base_url}/payroll/salaries/{sal_id}")
        print(r_del_sal.status_code, r_del_sal.text)
        
    # 6. Update Employee
    emp["FullName"] = "Test User Updated"
    print("Updating Employee...")
    r_upd = requests.put(f"{base_url}/hr/employees/{emp_id}", json=emp)
    print(r_upd.status_code, r_upd.text)
    
    # 7. Delete Employee
    print("Deleting Employee...")
    r_del = requests.delete(f"{base_url}/hr/employees/{emp_id}")
    print(r_del.status_code, r_del.text)
