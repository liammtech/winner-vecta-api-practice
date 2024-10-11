# Winner <-> Vecta API Bridge

#### Within BA:
- The Design Team uses the Winner Flex platform to undertake kitchen design work
- The Commercial Team uses Vecta as a CRM for tracking leads/sales opportunities etc.

## Brief
This project is to develop an API bridge, to enable automatic transfer of certain data between BA's databases on either platform.

#### Advantages this will bring:
- Will save administrative workload within the Design Team (manually replicating data from Winner within Vecta)
- Increase data integrity by reducing errors from such replication
- Commercial still have visibility of the Design Team's projects/leads
- Visibility may potentially be increased (for example, if any manual entries were previously missed)

## Project Breakdown
The API bridge will need to allow the transfer of data for design projects, either from Winner to Vecta, or case-depending, from Vecta to Winner. The data flow depends upon the route to market/customer type.

- Blossom Avenue/Retail =  <b>Winner -> Vecta</b>
- Kitchen Kit Merchants/Trade = <b>Winner -> Vecta</b>
- Kitchen Kit E-Commerse = <b>Vecta -> Winner -> Vecta</b>
