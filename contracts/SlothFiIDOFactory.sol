// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { SlothFiIDO } from "./SlothFiIDO.sol";

contract SlothFiIDOFactory is  Ownable {

    event IDOCreated(address indexed contractAddress, address indexed by);

    /// @notice Struct encapsulating all interesting properties of an IDO in one place.
    struct IDOInfo {
        uint256 startTime;
        uint256 endTime;
        uint256 claimTime;
        uint256 offeringAmount;
        uint256 raisingAmount;
        uint256 totalAmount;
        uint256 maxContributionAmount;
    }

    /// @notice Offering token address => ido contract address
    mapping (address => address) public idos;

    /// @notice List of all IDOs
    address[] public allIdos;

    /// @notice Creates the IDO factory
    /// @param owner The owner of the factory. This pattern allows for an address other than the
    /// contract depoloyer to be designated as the owner.
    constructor(address owner) {
        transferOwnership(owner);
    }

    /// @notice Creates a new IDO
    /// @dev Parameters are same as SlothFiIDO constructor
    function createIDO(
        IERC20 _raisingToken,
        IERC20 _offeringToken,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _claimTime,
        uint256 _offeringAmount,
        uint256 _raisingAmount,
        uint256 _maxContributionAmount,
        address _adminAddress,
        IERC20 _collateralToken,
        uint256 _requiredCollateralAmount
    ) external onlyOwner {
        SlothFiIDO ido = new SlothFiIDO(
        _raisingToken,
        _offeringToken,
        _startTime,
        _endTime,
        _claimTime,
        _offeringAmount,
        _raisingAmount,
        _maxContributionAmount,
        _adminAddress,
        _collateralToken,
        _requiredCollateralAmount
        );
        idos[address(_offeringToken)] = address(ido);
        allIdos.push(address(ido));

        emit IDOCreated(address(ido), msg.sender);
    }

    /// @notice Returns the last IDO held for this token as offeringToken.
    /// @dev Note: If multiple IDOs are helpd for a single offering token, the last
    /// one is returned by this method. Prefious IDO infos are still available
    /// from the `allIdos` list.
    /// @param tokenAddress the address of offering token used in an IDO.
    /// @return idoInfo the info about the ido at address.
    function getIDO(address tokenAddress) public view returns (IDOInfo memory idoInfo) {
        address idoAddress = idos[tokenAddress];
        require(idoAddress != address(0), "Invalid token address");
        idoInfo = _getIDOInfo(idoAddress);
    }

    /// @notice Returns list of all IDOs created
    /// @return idoList the info for all IDOs ever created.
    function getAllIDOs() public view returns (IDOInfo[] memory) {
        IDOInfo[] memory idoList = new IDOInfo[](allIdos.length);
        for (uint256 i = 0; i < allIdos.length; i++) {
            IDOInfo memory idoInfo = _getIDOInfo(allIdos[i]);
            idoList[i] = idoInfo;
        }
        return idoList;
    }

    function _getIDOInfo(address idoAddress) internal view returns (IDOInfo memory) {
        SlothFiIDO ido = SlothFiIDO(idoAddress);
        return IDOInfo({
           startTime: ido.startTime(),
            endTime: ido.endTime(),
            claimTime: ido.claimTime(),
            offeringAmount: ido.offeringAmount(),
            raisingAmount: ido.raisingAmount(),
            totalAmount: ido.totalAmount(),
            maxContributionAmount: ido.maxContributionAmount()
        });
    }
}